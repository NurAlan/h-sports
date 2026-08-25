"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FAB } from "@/components/fab";
import { Package, FileText, Wrench, CheckCircle2, Truck } from "lucide-react";
import { CreateOrderDialog } from "@/components/dialogs/create-order-dialog";

// Dummy data
const orders = [
  {
    id: "ORD-20260825-001",
    customer: "Toko Baju Sejahtera",
    qty: 50,
    status: "in_production",
    stage: "Jahit",
    orderDate: "2026-08-25",
    profit: "Rp 347,500",
  },
  {
    id: "ORD-20260824-003",
    customer: "PT Garmen Indo",
    qty: 100,
    status: "qc",
    stage: "QC",
    orderDate: "2026-08-24",
    profit: "Rp 1,200,000",
  },
  {
    id: "ORD-20260823-002",
    customer: "CV Tekstil Makmur",
    qty: 75,
    status: "shipped",
    stage: "Terkirim",
    orderDate: "2026-08-23",
    profit: "Rp 890,000",
  },
  {
    id: "ORD-20260822-001",
    customer: "Toko ABC",
    qty: 30,
    status: "draft",
    stage: "Draft",
    orderDate: "2026-08-22",
    profit: "-",
  },
];

// Color palette per status
const statusConfig: Record<
  string,
  {
    label: string;
    badgeClass: string;
    cardClass: string;
    icon: typeof Package;
    iconClass: string;
    textClass: string;
  }
> = {
  draft: {
    label: "Draft",
    badgeClass: "bg-gray-300 text-gray-800",
    cardClass: "bg-gray-200 border-gray-300",
    icon: FileText,
    iconClass: "bg-gray-400 text-white",
    textClass: "text-gray-700",
  },
  in_production: {
    label: "Produksi",
    badgeClass: "bg-blue-200 text-blue-800",
    cardClass: "bg-gray-200 border-gray-300",
    icon: Wrench,
    iconClass: "bg-blue-500 text-white",
    textClass: "text-blue-700",
  },
  qc: {
    label: "QC",
    badgeClass: "bg-amber-200 text-amber-800",
    cardClass: "bg-gray-200 border-gray-300",
    icon: CheckCircle2,
    iconClass: "bg-amber-500 text-white",
    textClass: "text-amber-700",
  },
  shipped: {
    label: "Terkirim",
    badgeClass: "bg-green-200 text-green-800",
    cardClass: "bg-gray-200 border-gray-300",
    icon: Truck,
    iconClass: "bg-green-500 text-white",
    textClass: "text-green-700",
  },
};

export default function OrdersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <PageHeader
        title="Orders"
        subtitle="Daftar pesanan kaos"
      />

      <div className="space-y-3">
        {orders.map((order) => {
          const config = statusConfig[order.status] || statusConfig.draft;
          const StatusIcon = config.icon;

          return (
            <Card
              key={order.id}
              className={`border card-shadow-lg ${config.cardClass}`}
            >
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-bold text-foreground">
                        {order.id}
                      </p>
                      <Badge
                        variant="secondary"
                        className={config.badgeClass}
                      >
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {order.customer}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {order.qty} pcs
                      </span>
                      <span>
                        {new Date(order.orderDate).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`${config.iconClass} p-2.5 rounded-xl shadow-md flex-shrink-0`}
                  >
                    <StatusIcon className="h-5 w-5" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/60">
                  <p className="text-xs text-muted-foreground">
                    Stage:{" "}
                    <span className={`font-semibold ${config.textClass}`}>
                      {order.stage}
                    </span>
                  </p>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Profit</p>
                    <p
                      className={`text-sm font-bold ${
                        order.profit === "-"
                          ? "text-muted-foreground"
                          : "text-green-600"
                      }`}
                    >
                      {order.profit}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <FAB onClick={() => setIsDialogOpen(true)} label="Buat Order Baru" />

      {/* Create Order Dialog */}
      <CreateOrderDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
