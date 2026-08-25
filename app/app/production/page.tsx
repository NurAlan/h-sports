"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, ArrowRight } from "lucide-react";
import { UpdateTimelineDialog } from "@/components/dialogs/update-timeline-dialog";
import { orders, getTimelineForOrder } from "@/lib/mock-data";

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

function getStageBadge(status: string) {
  const variants: Record<string, { label: string; className: string }> = {
    completed: { label: "Selesai", className: "bg-green-100 text-green-700" },
    in_progress: { label: "Sedang Dikerjakan", className: "bg-blue-100 text-blue-700" },
    not_started: { label: "Belum Dimulai", className: "bg-gray-100 text-gray-600" },
  };
  const config = variants[status] || { label: status, className: "" };
  return (
    <Badge variant="secondary" className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
}

export default function ProductionPage() {
  const [selectedOrder, setSelectedOrder] = useState<{
    id: string;
    orderNumber: string;
    stages: Array<{ name: string; status: string }>;
  } | null>(null);

  // Hanya order yang sedang/sudah masuk produksi
  const activeOrders = orders.filter(
    (o) => o.status === "in_production" || o.status === "qc"
  );

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

      <div className="space-y-4">
        {activeOrders.map((order) => {
          const timeline = getTimelineForOrder(order.id);
          return (
            <Card
              key={order.id}
              className="border border-blue-300 bg-blue-100 card-shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => handleOrderClick(order.id, order.orderNumber)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{order.orderNumber}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.customerName} • {order.qtyItems} pcs
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                      Klik untuk Update
                    </Badge>
                    <Link
                      href={`/orders/${order.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-0.5 text-[11px] text-primary hover:underline"
                    >
                      Lihat detail <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {timeline.map((stage, index) => (
                  <div
                    key={stage.name}
                    className="flex items-center gap-3 pb-3 border-b border-border/60 last:border-0 last:pb-0"
                  >
                    <div className="flex-shrink-0">
                      {getStageIcon(stage.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {index + 1}. {stage.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {stage.duration}
                      </p>
                    </div>
                    <div>{getStageBadge(stage.status)}</div>
                  </div>
                ))}
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
