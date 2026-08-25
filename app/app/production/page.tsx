"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
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
import { orders, getTimelineForOrder, getBOMForOrder } from "@/lib/mock-data";
import {
  formatDate,
  daysUntil,
  daysLeftLabel,
  cn,
} from "@/lib/utils";

// Warna card berdasarkan deadline (konsisten dengan Orders)
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

/** Warna progress bar berdasarkan % */
function getProgressColor(pct: number) {
  if (pct >= 75) return "bg-green-500";
  if (pct >= 50) return "bg-blue-500";
  if (pct >= 25) return "bg-orange-500";
  return "bg-red-500";
}

/** Indikator estimasi vs aktual untuk stage yang berjalan/selesai */
function getEstimateStatus(stage: {
  status: string;
  actualHrs: number | null;
  estimatedHrs: number;
}) {
  if (stage.status === "not_started" || stage.actualHrs === null) return null;
  const diff = stage.actualHrs - stage.estimatedHrs;
  if (stage.status === "in_progress") {
    if (diff > 0) {
      return {
        label: `Melebihi estimasi ${diff.toFixed(1)}h`,
        className: "text-red-600",
      };
    }
    return {
      label: `Sisa ${(stage.estimatedHrs - stage.actualHrs).toFixed(1)}h dari estimasi`,
      className: "text-green-600",
    };
  }
  // completed
  if (diff > 0) {
    return {
      label: `Terlambat ${diff.toFixed(1)}h dari estimasi`,
      className: "text-red-600",
    };
  }
  return {
    label: "Sesuai estimasi",
    className: "text-green-600",
  };
}

export default function ProductionPage() {
  const [selectedOrder, setSelectedOrder] = useState<{
    id: string;
    orderNumber: string;
    stages: Array<{ name: string; status: string }>;
  } | null>(null);

  const activeOrders = orders
    .filter((o) => o.status === "in_production" || o.status === "qc")
    .sort((a, b) => a.deadline.localeCompare(b.deadline)); // deadline terdekat dulu

  const handleOrderClick = (id: string, orderNumber: string) => {
    setSelectedOrder({
      id,
      orderNumber,
      stages: getTimelineForOrder(id),
    });
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <PageHeader
        title="Production"
        subtitle="Timeline produksi order"
      />

      <div className="flex flex-col gap-5">
        {activeOrders.map((order) => {
          const timeline = getTimelineForOrder(order.id);
          const bom = getBOMForOrder(order.id);
          const days = daysUntil(order.deadline);
          const isShipped = order.status === "shipped";

          // Progress keseluruhan
          const completedCount = timeline.filter(
            (s) => s.status === "completed"
          ).length;
          const progressPct =
            timeline.length > 0
              ? Math.round((completedCount / timeline.length) * 100)
              : 0;

          // Estimasi sisa jam dari stage yang belum selesai
          const remainingHrs = timeline
            .filter((s) => s.status !== "completed")
            .reduce((sum, s) => sum + s.estimatedHrs, 0);

          // Total bahan yang dibutuhkan
          const totalBomKg = bom.reduce((s, i) => s + i.qtyActual, 0);

          return (
            <Card
              key={order.id}
              className={`border card-shadow-lg cursor-pointer hover:shadow-xl transition-shadow ${getCardClass(
                days,
                isShipped
              )}`}
              onClick={() => handleOrderClick(order.id, order.orderNumber)}
            >
              <CardHeader className="pb-2">
                {/* Header: order number + status + deadline */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-bold text-foreground">
                        {order.orderNumber}
                      </p>
                      <Badge
                        variant="secondary"
                        className={
                          order.status === "qc"
                            ? "bg-amber-200 text-amber-800"
                            : "bg-blue-200 text-blue-800"
                        }
                      >
                        {order.status === "qc" ? "QC" : "Produksi"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.customerName} • {order.qtyItems} pcs
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`shrink-0 ${getDeadlineBadgeClass(days, isShipped)}`}
                  >
                    {daysLeftLabel(days)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Progress bar keseluruhan */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-foreground">
                      Progress
                    </span>
                    <span className="text-xs font-bold">
                      {completedCount}/{timeline.length} stage • {progressPct}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-white/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getProgressColor(
                        progressPct
                      )}`}
                      style={{ width: `${Math.max(progressPct, 4)}%` }}
                    />
                  </div>
                </div>

                {/* Stage list dengan estimasi vs aktual */}
                <div className="space-y-2">
                  {timeline.map((stage, index) => {
                    const estimate = getEstimateStatus(stage);
                    return (
                      <div
                        key={stage.name}
                        className="flex items-center gap-2.5 py-1.5 border-b border-border/40 last:border-0"
                      >
                        <div className="flex-shrink-0">
                          {getStageIcon(stage.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {index + 1}. {stage.name}
                          </p>
                          {estimate ? (
                            <p
                              className={`text-xs ${estimate.className} flex items-center gap-1`}
                            >
                              {estimate.label === "Sesuai estimasi" ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : estimate.label.startsWith("Terlambat") ||
                                estimate.label.startsWith("Melebihi") ? (
                                <AlertTriangle className="h-3 w-3" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              {estimate.label}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Estimasi {stage.estimatedHrs}h
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-1.5 py-0 ${
                              stage.status === "completed"
                                ? "bg-green-200 text-green-800"
                                : stage.status === "in_progress"
                                ? "bg-blue-200 text-blue-800"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {stage.status === "completed"
                              ? "Selesai"
                              : stage.status === "in_progress"
                              ? "Berjalan"
                              : "Antri"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer: ETA + BOM ringkas + link detail */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <CalendarClock className="h-3 w-3 shrink-0" />
                      Deadline: {formatDate(order.deadline)} • Sisa {remainingHrs}h kerja
                    </p>
                    {bom.length > 0 && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Package className="h-3 w-3 shrink-0" />
                        Bahan: {bom.length} jenis • {totalBomKg.toFixed(1)} kg
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/orders/${order.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-0.5 text-[11px] text-primary hover:underline shrink-0"
                  >
                    Detail <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {activeOrders.length === 0 && (
          <Card className="bg-white border-gray-300 card-shadow-lg">
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Belum ada order dalam produksi
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Update Timeline Dialog */}
      {selectedOrder && (
        <UpdateTimelineDialog
          open={!!selectedOrder}
          onOpenChange={(open) => !open && setSelectedOrder(null)}
          orderId={selectedOrder.id}
          orderNumber={selectedOrder.orderNumber}
          currentStages={selectedOrder.stages}
        />
      )}
    </div>
  );
}
