"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FAB } from "@/components/fab";
import { Package, FileText, Wrench, CheckCircle2, Truck, ChevronRight } from "lucide-react";
import { CreateOrderDialog } from "@/components/dialogs/create-order-dialog";
import { orders } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

// Color palette per status
const statusConfig: Record<
  string,
  {
    label: string;
    badgeClass: string;
    icon: typeof Package;
    iconClass: string;
    textClass: string;
  }
> = {
  draft: {
    label: "Draft",
    badgeClass: "bg-gray-300 text-gray-800",
    icon: FileText,
    iconClass: "bg-gray-400 text-white",
    textClass: "text-gray-700",
  },
  in_production: {
    label: "Produksi",
    badgeClass: "bg-blue-200 text-blue-800",
    icon: Wrench,
    iconClass: "bg-blue-500 text-white",
    textClass: "text-blue-700",
  },
  qc: {
    label: "QC",
    badgeClass: "bg-amber-200 text-amber-800",
    icon: CheckCircle2,
    iconClass: "bg-amber-500 text-white",
    textClass: "text-amber-700",
  },
  shipped: {
    label: "Terkirim",
    badgeClass: "bg-green-200 text-green-800",
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

      <div className="space-y-5">
        {orders.map((order) => {
          const config = statusConfig[order.status] || statusConfig.draft;
          const StatusIcon = config.icon;

          return (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="border card-shadow-lg bg-gray-200 border-gray-300 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-bold text-foreground">
                          {order.orderNumber}
                        </p>
                        <Badge
                          variant="secondary"
                          className={config.badgeClass}
                        >
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {order.customerName}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {order.qtyItems} pcs
                        </span>
                        <span>{formatDate(order.orderDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 flex-shrink-0">
                      <div
                        className={`${config.iconClass} p-2.5 rounded-xl shadow-md`}
                      >
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
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
            </Link>
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
