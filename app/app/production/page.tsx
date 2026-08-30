"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { UpdateTimelineDialog } from "@/components/dialogs/update-timeline-dialog";
import { api, type Order, type ProductionTimeline } from "@/lib/api";
import { OrderCardSkeleton } from "@/components/skeletons";
import {
  formatDate,
  daysUntil,
  daysLeftLabel,
  cn,
} from "@/lib/utils";
import { DEADLINE_STATUS } from "@/lib/status-config";

function getCardClass(days: number, isShipped: boolean) {
  if (isShipped) return "border-green-300 bg-green-100";
  if (days < 0) return "border-red-500 bg-red-300";
  if (days <= 1) return "border-red-300 bg-red-100";
  if (days < 3) return "border-orange-300 bg-orange-100";
  return "border-blue-300 bg-blue-100";
}

function getDeadlineBadgeClass(days: number, isShipped: boolean) {
  if (isShipped) return DEADLINE_STATUS.safe.className;
  if (days < 0) return DEADLINE_STATUS.overdue.className;
  if (days <= 1) return DEADLINE_STATUS.urgent.className;
  if (days < 3) return DEADLINE_STATUS.warning.className;
  return "bg-blue-200 text-blue-800";
}

function getStageIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "in_progress":
      return <Clock className="h-4 w-4 text-blue-600" />;
    default:
      return <Circle className="h-4 w-4 text-gray-300" />;
  }
}

function getProgressColor(pct: number) {
  if (pct >= 75) return "bg-green-500";
  if (pct >= 50) return "bg-blue-500";
  if (pct >= 25) return "bg-orange-500";
  return "bg-red-500";
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
    className: stage.status === "in_progress" ? "text-blue-600" : "text-green-600",
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

      {orders.length === 0 && (
        <Card className="bg-white border-gray-300 card-shadow-lg">
          <CardContent className="py-10 text-center">
            <Wrench className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-base font-medium text-foreground mb-1">
              Tidak ada order dalam produksi
            </p>
            <p className="text-sm text-muted-foreground">
              Order yang berstatus Produksi atau QC akan muncul di sini
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-5">
        {orders.map((order) => {
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
                      {order.orderNumber}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {order.customerName} • {order.qtyItems} pcs
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
                      className={`h-full rounded-full transition-all duration-300 ${getProgressColor(progressPct)}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Stages List */}
                <div className="space-y-2 mb-3.5 bg-white/70 rounded-xl p-3 border border-border/50">
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
                            isInProgress ? "text-blue-900 font-bold" : isCompleted ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {stage.stageName}
                          </span>
                        </div>

                        {/* Date info / Badge */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isCompleted && stage.actualEnd && (
                            <span className="text-[11px] font-medium text-green-800 bg-green-100/90 border border-green-300 px-2 py-0.5 rounded-md">
                              {formatShortDate(stage.actualEnd)}{duration ? ` (${duration})` : ""}
                            </span>
                          )}
                          {isInProgress && (
                            <span className="text-[11px] font-semibold text-blue-800 bg-blue-100/90 border border-blue-300 px-2 py-0.5 rounded-md animate-pulse">
                              {stage.actualStart ? `Mulai ${formatShortDate(stage.actualStart)}` : "Berjalan"}
                            </span>
                          )}
                          {!isCompleted && !isInProgress && (
                            <span className="text-[11px] text-muted-foreground/70">
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

                <div className="mt-2.5 pt-2 border-t border-border/30 flex items-center justify-between">
                  <span className="text-[11px] text-primary font-medium">Klik untuk update timeline</span>
                  <Link
                    href={`/orders/${order.id}`}
                    className="text-[11px] font-semibold text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Detail Order →
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
