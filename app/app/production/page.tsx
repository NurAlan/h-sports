"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { UpdateTimelineDialog } from "@/components/dialogs/update-timeline-dialog";

// Dummy data
const activeOrders = [
  {
    id: "1",
    orderNumber: "ORD-20260825-001",
    customer: "Toko Baju Sejahtera",
    stages: [
      { name: "Pengukuran", status: "completed", duration: "2h" },
      { name: "Pemotongan", status: "completed", duration: "4h" },
      { name: "Jahit", status: "in_progress", duration: "8h / 12h" },
      { name: "Finishing", status: "not_started", duration: "3h" },
      { name: "QC", status: "not_started", duration: "1h" },
    ],
  },
  {
    id: "2",
    orderNumber: "ORD-20260824-003",
    customer: "PT Garmen Indo",
    stages: [
      { name: "Pengukuran", status: "completed", duration: "3h" },
      { name: "Pemotongan", status: "completed", duration: "5h" },
      { name: "Jahit", status: "completed", duration: "16h" },
      { name: "Finishing", status: "completed", duration: "4h" },
      { name: "QC", status: "in_progress", duration: "0.5h / 2h" },
    ],
  },
];

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

  const handleOrderClick = (order: typeof activeOrders[0]) => {
    setSelectedOrder({
      id: order.id,
      orderNumber: order.orderNumber,
      stages: order.stages,
    });
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <PageHeader
        title="Production"
        subtitle="Timeline produksi order"
      />

      <div className="space-y-4">
        {activeOrders.map((order) => (
          <Card 
            key={order.id} 
            className="border border-blue-300 bg-blue-100 card-shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => handleOrderClick(order)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{order.orderNumber}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {order.customer}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Klik untuk Update
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.stages.map((stage, index) => (
                <div
                  key={stage.name}
                  className="flex items-center gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
                >
                  <div className="flex-shrink-0">
                    {getStageIcon(stage.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {stage.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {stage.duration}
                    </p>
                  </div>
                  <div>
                    {getStageBadge(stage.status)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
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
