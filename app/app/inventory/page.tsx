"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { MenuGuide } from "@/components/tutorial/menu-guide";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FAB } from "@/components/fab";
import { ChevronRight, AlertTriangle, Search } from "lucide-react";
import { AddFabricPurchaseDialog } from "@/components/dialogs/add-fabric-purchase-dialog";
import { api } from "@/lib/api";
import { FabricCardSkeleton } from "@/components/skeletons";
import { formatRupiah, formatDate } from "@/lib/utils";

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  reorderPoint: number;
  stock: number;
  avgPrice: number;
  lastPurchase: string | null;
  batchCount: number;
  isLowStock: boolean;
}

export default function InventoryPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<InventoryItem[]>("/api/inventory")
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const filteredFabrics = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((f) => f.name.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <PageHeader
        title="Inventory"
        subtitle="Stok kain & pembelian"
        action={<MenuGuide menuKey="inventory" />}
      />

      {/* Search nama bahan */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Cari nama bahan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {/* Compact cards — grid 2 kolom */}
      {loading && (
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <FabricCardSkeleton key={i} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {!loading && filteredFabrics.map((fabric) => {
          const stock = fabric.stock;
          const avgPrice = fabric.avgPrice;
          const lastPurchase = fabric.lastPurchase;
          const isLowStock = fabric.isLowStock;

          return (
            <Link key={fabric.id} href={`/inventory/${fabric.id}`} className="h-full">
              <Card
                className={`h-full border card-shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all ${
                  isLowStock
                    ? "border-red-300 bg-red-100"
                    : "border-gray-300 bg-white"
                }`}
              >
                <CardContent className="p-4 flex flex-col flex-1">
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
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/60">
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

      {/* Empty state saat tidak ada hasil */}
      {filteredFabrics.length === 0 && (
        <Card className="bg-white border-gray-300 card-shadow-lg">
          <CardContent className="py-10 text-center">
            <p className="text-sm font-medium text-foreground mb-1">
              Bahan tidak ditemukan
            </p>
            <p className="text-xs text-muted-foreground">
              Tidak ada hasil untuk "{search}"
            </p>
          </CardContent>
        </Card>
      )}

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
