"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FAB } from "@/components/fab";
import { ChevronRight, AlertTriangle } from "lucide-react";
import { AddFabricPurchaseDialog } from "@/components/dialogs/add-fabric-purchase-dialog";
import {
  fabrics,
  getFabricStock,
  getFabricAvgPrice,
  getFabricLastPurchase,
} from "@/lib/mock-data";
import { formatRupiah, formatDate } from "@/lib/utils";

export default function InventoryPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <PageHeader
        title="Inventory"
        subtitle="Stok kain & pembelian"
      />

      {/* Compact cards — grid 2 kolom */}
      <div className="grid grid-cols-2 gap-3">
        {fabrics.map((fabric) => {
          const stock = getFabricStock(fabric.id);
          const avgPrice = getFabricAvgPrice(fabric.id);
          const lastPurchase = getFabricLastPurchase(fabric.id);
          const isLowStock = stock <= fabric.reorderPoint;

          return (
            <Link key={fabric.id} href={`/inventory/${fabric.id}`}>
              <Card
                className={`border card-shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all ${
                  isLowStock
                    ? "border-red-300 bg-red-100 border-2"
                    : "border-gray-300 bg-white"
                }`}
              >
                <CardContent className="p-4">
                  {/* Nama kain */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {fabric.name}
                    </p>
                    {isLowStock && (
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                    )}
                  </div>

                  {/* Stok besar */}
                  <div className="flex items-baseline gap-1 mb-1">
                    <p
                      className={`text-2xl font-bold ${
                        isLowStock ? "text-red-600" : "text-foreground"
                      }`}
                    >
                      {stock.toLocaleString("id-ID")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fabric.unit}
                    </p>
                  </div>

                  {/* Info kecil */}
                  <p className="text-[11px] text-muted-foreground mb-2">
                    {formatRupiah(avgPrice)}/{fabric.unit}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Beli: {lastPurchase ? formatDate(lastPurchase) : "-"}
                  </p>

                  {/* Footer: reorder atau lihat detail */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/60">
                    {isLowStock ? (
                      <Badge
                        variant="secondary"
                        className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0"
                      >
                        ⚠️ Reorder {fabric.reorderPoint} {fabric.unit}
                      </Badge>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        Riwayat & sisa
                      </span>
                    )}
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <FAB onClick={() => setIsDialogOpen(true)} label="Tambah Pembelian Kain" />

      {/* Add Fabric Purchase Dialog */}
      <AddFabricPurchaseDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
