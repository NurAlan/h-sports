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

function getCardClass(days: number, isShipped: boolean) {
  if (isShipped) return "border-green-300 bg-green-100";
  if (days < 0) return "border-red-500 bg-red-300";
  if (days <= 1) return "border-red-300 bg-red-100";
  if (days < 3) return "border-orange-300 bg-orange-100";
  return "border-blue-300 bg-blue-100";
}

function getDeadlineBadgeClass(days: number, isShipped: boolean) {
  if (isShipped) return "bg-green-200 text-green-800";
  if (days < 0) return "bg-red-700 text-white";
  if (days <= 1) return "bg-red-500 text-white";
  if (days < 3) return "bg-orange-500 text-white";
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
    stages: Array<{ name: string; status: string }>;
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
      stages: order.timelines.map((t) => ({ name: t.stageName, status: t.status })),
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
            <p className="text-sm font-medium text-foreground mb-1">
              Tidak ada order dalam produksi
            </p>
            <p className="text-xs text-muted-foreground">
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
              className={`border card-shadow-lg cursor-pointer hover:shadow-xl transition-shadow ${getCardClass(
                days,
                isShipped
              )}`}
              onClick={() => handleOrderClick(order)}
            >
              <CardContent className="pt-4 pb-4">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {order.customerName} • {order.qtyItems} pcs
                    </p>
                  </div>
                  <Badge variant="secondary" className={getDeadlineBadgeClass(days, isShipped)}>
                    {isShipped
                      ? "Selesai"
                      : order.deadline
                        ? daysLeftLabel(days)
                        : "No deadline"}
                  </Badge>
                </div>

                {/* Progress */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Progress
                    </p>
                    <p className="text-xs font-semibold text-foreground">
                      {completedCount}/{timeline.length} stage • {progressPct}%
                    </p>
                  </div>
                  <div className="h-2 w-full bg-white/70 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getProgressColor(progressPct)}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Stages */}
                <div className="space-y-1.5 mb-3">
                  {timeline.map((stage, i) => {
                    const estimate = getEstimateStatus(stage);
                    return (
                      <div key={stage.id} className="flex items-center gap-2">
                        {getStageIcon(stage.status)}
                        <p className="text-xs text-foreground flex-1">
                          {stage.stageName}
                        </p>
                        {estimate ? (
                          <span className={`text-[10px] font-medium ${estimate.className}`}>
                            {estimate.label}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            {stage.estimatedHrs ? `±${stage.estimatedHrs}h` : ""}
                          </span>
                        )}
                        {i < timeline.length - 1 && (
                          <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border/50 pt-2.5">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <CalendarClock className="h-3 w-3" />
                    {order.deadline
                      ? `Deadline ${formatDate(order.deadline)}${remainingHrs > 0 ? ` • sisa ±${remainingHrs}h` : ""}`
                      : "Tanpa deadline"}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Package className="h-3 w-3" />
                    {bom.length} jenis • {totalBomKg.toFixed(1)} kg
                  </span>
                </div>

                {bom.some(() => true) && (
                  <Link
                    href={`/orders/${order.id}`}
                    className="mt-2 text-[11px] font-medium text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Lihat detail order →
                  </Link>
                )}
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
      />
    </div>
  );
}
