"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { MenuGuide } from "@/components/tutorial/menu-guide";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  CalendarClock,
  Package,
  AlertTriangle,
  Wrench,
  ChevronRight,
  Filter,
  Search,
  X,
} from "lucide-react";
import { UpdateTimelineDialog } from "@/components/dialogs/update-timeline-dialog";
import { api, type Order, type ProductionTimeline } from "@/lib/api";
import { OrderCardSkeleton } from "@/components/skeletons";
import { DateRangeFilter } from "@/components/filters/date-range-filter";
import {
  formatDate,
  daysUntil,
  daysLeftLabel,
  cn,
} from "@/lib/utils";
import { DEADLINE_STATUS } from "@/lib/status-config";

function getCardClass(days: number, isShipped: boolean) {
  if (isShipped) return "bg-white border-stone-200 border-l-4 border-l-emerald-500";
  if (days < 0) return "bg-white border-stone-200 border-l-4 border-l-red-600";
  if (days <= 1) return "bg-white border-stone-200 border-l-4 border-l-orange-500";
  if (days < 3) return "bg-white border-stone-200 border-l-4 border-l-amber-500";
  return "bg-white border-stone-200 border-l-4 border-l-stone-400";
}

function getDeadlineBadgeClass(days: number, isShipped: boolean) {
  if (isShipped) return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (days < 0) return "bg-red-50 text-red-700 border border-red-200 font-semibold";
  if (days <= 1) return "bg-orange-50 text-orange-700 border border-orange-200 font-semibold";
  if (days < 3) return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-stone-100 text-stone-600 border border-stone-200";
}

function getStageIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case "in_progress":
      return <Clock className="h-4 w-4 text-indigo-600 motion-safe:animate-pulse" />;
    default:
      return <Circle className="h-4 w-4 text-stone-300" />;
  }
}

function getProgressColor(pct: number) {
  if (pct >= 75) return "bg-emerald-500";
  if (pct >= 50) return "bg-emerald-400";
  if (pct >= 25) return "bg-amber-500";
  return "bg-stone-400";
}

/** Indikator estimasi vs aktual untuk stage (in_progress) */
function getEstimateStatus(stage: ProductionTimeline) {
  if (stage.status === "not_started") return null;
  return {
    label:
      stage.status === "in_progress"
        ? `Sedang dikerjakan${stage.estimatedHrs ? ` (estimasi ${stage.estimatedHrs}h)` : ""}`
        : stage.estimatedHrs
          ? `Selesai (${stage.estimatedHrs}h estimasi)`
          : "Selesai",
    className: stage.status === "in_progress" ? "text-indigo-600" : "text-emerald-600",
  };
}

function formatShortDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function calculateDuration(startStr?: string | null, endStr?: string | null): string | null {
  if (!startStr || !endStr) return null;
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return null;
  const diffHours = Math.max(1, Math.round((end - start) / (1000 * 60 * 60)));
  if (diffHours < 24) {
    return `${diffHours} jam`;
  }
  const diffDays = Math.max(1, Math.round(diffHours / 24));
  return `${diffDays} hari`;
}

interface OrderWithData extends Order {
  timelines: ProductionTimeline[];
  bomItems: { fabricName: string; qtyActual: number }[];
}

export default function ProductionPage() {
  const [orders, setOrders] = useState<OrderWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "overdue" | "urgent" | "ontrack">("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<{
    id: string;
    orderNumber: string;
    stages: Array<{
      name: string;
      status: string;
      actualStart?: string | null;
      actualEnd?: string | null;
      estimatedHrs?: number | null;
    }>;
  } | null>(null);

  useEffect(() => {
    api
      .get<OrderWithData[]>("/api/production")
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filter orders berdasarkan deadline status + search + date range
  const filteredOrders = useMemo(() => {
    let result = orders;

    // Filter by deadline status
    if (filter !== "all") {
      result = result.filter((order) => {
        const days = order.deadline ? daysUntil(order.deadline) : 999;
        const isShipped = order.status === "shipped";
        if (filter === "overdue") return !isShipped && days < 0;
        if (filter === "urgent") return !isShipped && days >= 0 && days <= 2;
        if (filter === "ontrack") return !isShipped && days > 2;
        return true;
      });
    }

    // Filter by search (nama customer atau no order)
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (o) =>
          o.customerName.toLowerCase().includes(q) ||
          o.orderNumber.toLowerCase().includes(q)
      );
    }

    // Filter by date range (berdasarkan orderDate)
    if (startDate) {
      result = result.filter((o) => o.orderDate >= startDate);
    }
    if (endDate) {
      result = result.filter((o) => o.orderDate <= endDate);
    }

    return result;
  }, [orders, filter, search, startDate, endDate]);

  // Count untuk badge filters
  const counts = useMemo(() => {
    const result = {
      all: orders.length,
      overdue: 0,
      urgent: 0,
      ontrack: 0,
    };
    
    orders.forEach((order) => {
      const days = order.deadline ? daysUntil(order.deadline) : 999;
      const isShipped = order.status === "shipped";
      
      if (!isShipped) {
        if (days < 0) result.overdue++;
        else if (days <= 2) result.urgent++;
        else result.ontrack++;
      }
    });
    
    return result;
  }, [orders]);

  const handleOrderClick = (order: OrderWithData) => {
    setSelectedOrder({
      id: order.id,
      orderNumber: order.orderNumber,
      stages: order.timelines.map((t) => ({
        name: t.stageName,
        status: t.status,
        actualStart: t.actualStart,
        actualEnd: t.actualEnd,
        estimatedHrs: t.estimatedHrs,
      })),
    });
  };

  if (loading) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6">
        <PageHeader title="Production" subtitle="Memuat..." />
        <div className="space-y-4">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <PageHeader
        title="Production"
        subtitle="Timeline produksi order"
        action={<MenuGuide menuKey="production" />}
      />

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Cari nama customer / no. order..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-xl border border-stone-300 bg-white pl-9 pr-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 shadow-xs transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Bersihkan pencarian"
            className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Date Range Filter */}
      <div className="mb-3">
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
        />
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar pb-2">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0",
            filter === "all"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white text-stone-700 border border-stone-300 hover:bg-stone-50"
          )}
        >
          Semua
          {counts.all > 0 && (
            <span className={cn(
              "ml-1.5 px-1.5 py-0.5 rounded-md text-xs font-bold",
              filter === "all" ? "bg-white/20 text-white" : "bg-stone-100 text-stone-700"
            )}>
              {counts.all}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter("overdue")}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0",
            filter === "overdue"
              ? "bg-red-600 text-white shadow-sm"
              : "bg-white text-stone-700 border border-stone-300 hover:bg-stone-50"
          )}
        >
          Terlambat
          {counts.overdue > 0 && (
            <span className={cn(
              "ml-1.5 px-1.5 py-0.5 rounded-md text-xs font-bold",
              filter === "overdue" ? "bg-white/20 text-white" : "bg-red-100 text-red-700"
            )}>
              {counts.overdue}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter("urgent")}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0",
            filter === "urgent"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-white text-stone-700 border border-stone-300 hover:bg-stone-50"
          )}
        >
          Mendesak
          {counts.urgent > 0 && (
            <span className={cn(
              "ml-1.5 px-1.5 py-0.5 rounded-md text-xs font-bold",
              filter === "urgent" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"
            )}>
              {counts.urgent}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter("ontrack")}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0",
            filter === "ontrack"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white text-stone-700 border border-stone-300 hover:bg-stone-50"
          )}
        >
          On Track
          {counts.ontrack > 0 && (
            <span className={cn(
              "ml-1.5 px-1.5 py-0.5 rounded-md text-xs font-bold",
              filter === "ontrack" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
            )}>
              {counts.ontrack}
            </span>
          )}
        </button>
      </div>

      {filteredOrders.length === 0 && (
        <Card className="bg-white border-stone-300 card-shadow-lg">
          <CardContent className="py-10 text-center">
            <Wrench className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-base font-medium text-foreground mb-1">
              {filter === "all" 
                ? "Tidak ada order dalam produksi"
                : `Tidak ada order ${filter === "overdue" ? "terlambat" : filter === "urgent" ? "mendesak" : "on track"}`
              }
            </p>
            <p className="text-sm text-muted-foreground">
              {filter === "all"
                ? "Order yang berstatus Produksi atau QC akan muncul di sini"
                : "Coba filter lain untuk melihat order lainnya"
              }
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-5">
        {filteredOrders.map((order) => {
          const timeline = order.timelines;
          const bom = order.bomItems;
          const days = order.deadline ? daysUntil(order.deadline) : 999;
          const isShipped = order.status === "shipped";

          const completedCount = timeline.filter((s) => s.status === "completed").length;
          const progressPct =
            timeline.length > 0
              ? Math.round((completedCount / timeline.length) * 100)
              : 0;

          const remainingHrs = timeline
            .filter((s) => s.status !== "completed")
            .reduce((sum, s) => sum + (s.estimatedHrs ?? 0), 0);

          const totalBomKg = bom.reduce((s, i) => s + i.qtyActual, 0);

          return (
            <Card
              key={order.id}
              className={`border card-shadow-lg cursor-pointer hover:shadow-xl active:scale-[0.99] transition-all ${getCardClass(
                days,
                isShipped
              )}`}
              onClick={() => handleOrderClick(order)}
            >
              <CardContent className="p-4 sm:p-5">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="text-base font-bold text-foreground truncate">
                      {order.customerName}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {order.orderNumber} • {order.qtyItems} pcs
                    </p>
                  </div>
                  <Badge variant="secondary" className={`shrink-0 text-xs ${getDeadlineBadgeClass(days, isShipped)}`}>
                    {isShipped
                      ? "Selesai"
                      : order.deadline
                        ? daysLeftLabel(days)
                        : "No deadline"}
                  </Badge>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <span className="font-medium text-muted-foreground">
                      Progress Produksi
                    </span>
                    <span className="font-bold text-foreground">
                      {completedCount}/{timeline.length} stage ({progressPct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-white/80 rounded-full overflow-hidden border border-black/5">
                    <div
                      role="progressbar"
                      aria-valuenow={progressPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progress produksi: ${progressPct}%`}
                      className={`h-full rounded-full transition-all duration-300 ${getProgressColor(progressPct)}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Stages List */}
                <div className="space-y-2 mb-3.5 bg-stone-50 rounded-lg p-3 border border-stone-200/70">
                  {timeline.map((stage) => {
                    const isCompleted = stage.status === "completed";
                    const isInProgress = stage.status === "in_progress";
                    const duration = calculateDuration(stage.actualStart, stage.actualEnd);

                    return (
                      <div key={stage.id} className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          {getStageIcon(stage.status)}
                          <span className={cn(
                            "font-medium capitalize truncate",
                            isInProgress ? "text-sky-600 font-semibold" : isCompleted ? "text-foreground font-medium" : "text-stone-400"
                          )}>
                            {stage.stageName}
                          </span>
                        </div>

                        {/* Date info / Badge */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isCompleted && stage.actualEnd && (
                            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              {formatShortDate(stage.actualEnd)}{duration ? ` (${duration})` : ""}
                            </span>
                          )}
                          {isInProgress && (
                            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md animate-pulse">
                              {stage.actualStart ? `Mulai ${formatShortDate(stage.actualStart)}` : "Berjalan"}
                            </span>
                          )}
                          {!isCompleted && !isInProgress && (
                            <span className="text-[11px] text-stone-400">
                              {stage.estimatedHrs ? `±${stage.estimatedHrs}h` : "Belum mulai"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border/50 pt-2.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {order.deadline
                      ? `Deadline: ${formatDate(order.deadline)}${remainingHrs > 0 ? ` (sisa ±${remainingHrs}h)` : ""}`
                      : "Tanpa deadline"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" />
                    {totalBomKg.toFixed(1)} kg
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOrderClick(order);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-xs"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Update Timeline
                  </button>
                  <Link
                    href={`/orders/${order.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100/80 transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Detail Order <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <UpdateTimelineDialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
        orderId={selectedOrder?.id ?? ""}
        orderNumber={selectedOrder?.orderNumber ?? ""}
        currentStages={selectedOrder?.stages ?? []}
        onUpdated={() => {
          // Refetch daftar produksi — progress bar terupdate tanpa reload
          api
            .get<OrderWithData[]>("/api/production")
            .then(setOrders)
            .catch(() => {});
        }}
      />
    </div>
  );
}
