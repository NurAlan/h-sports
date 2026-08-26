"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { MenuGuide } from "@/components/tutorial/menu-guide";
import { Card, CardContent } from "@/components/ui/card";
import { FAB } from "@/components/fab";
import { ChevronRight, AlertTriangle, Search, Package } from "lucide-react";
import { AddFabricPurchaseDialog } from "@/components/dialogs/add-fabric-purchase-dialog";
import { api } from "@/lib/api";
import { FabricCardSkeleton } from "@/components/skeletons";

interface InventoryColor {
  colorId: string;
  colorName: string;
  stock: number;
  avgPrice: number;
  lastPurchase: string | null;
  isLowStock: boolean;
}

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  reorderPoint: number;
  totalStock: number;
  stock: number; // alias totalStock (backward compat)
  avgPrice: number;
  lastPurchase: string | null;
  colorCount: number;
  isLowStock: boolean;
  colors: InventoryColor[];
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.colors.some((c) => c.colorName.toLowerCase().includes(q))
    );
  }, [items, search]);

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <PageHeader
        title="Inventory"
        subtitle="Stok kain & warna"
        action={<MenuGuide menuKey="inventory" />}
      />

      {/* Error state */}
      {error && !loading && (
        <Card className="bg-red-50 border-red-300 card-shadow-lg mb-4">
          <CardContent className="py-6 text-center">
            <p className="text-sm font-semibold text-red-700 mb-1">Gagal memuat data</p>
            <p className="text-xs text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Cari nama kain atau warna..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {/* Skeleton loading */}
      {loading && (
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <FabricCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {!loading && filtered.length === 0 && !search && (
          <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center mb-3">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">Belum ada stok kain</p>
            <p className="text-xs text-muted-foreground max-w-[220px]">
              Tambah pembelian kain pertama dengan tombol + di bawah
            </p>
          </div>
        )}
        {!loading && filtered.length === 0 && search && (
          <div className="col-span-2 text-center py-8">
            <p className="text-sm text-muted-foreground">Tidak ada kain yang cocok dengan &quot;{search}&quot;</p>
          </div>
        )}

        {!loading &&
          filtered.map((fabric) => (
            <Link key={fabric.id} href={`/inventory/${fabric.id}`} className="h-full">
              <Card
                className={`h-full border card-shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all ${
                  fabric.isLowStock ? "border-red-300 bg-red-100" : "border-gray-300 bg-white"
                }`}
              >
                <CardContent className="p-4 flex flex-col">
                  {/* Nama kain */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <p className="text-xs font-semibold text-foreground truncate">{fabric.name}</p>
                    {fabric.isLowStock && (
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                    )}
                  </div>

                  {/* Total stok */}
                  <p
                    className={`text-xl font-bold mb-0.5 ${
                      fabric.isLowStock ? "text-red-700" : "text-foreground"
                    }`}
                  >
                    {fabric.totalStock} <span className="text-sm font-normal">kg</span>
                  </p>

                  {/* Warna chips */}
                  <div className="flex flex-wrap gap-1 mt-2 mb-2 min-h-[20px]">
                    {(fabric.colors ?? []).slice(0, 3).map((c) => (
                      <span
                        key={c.colorId}
                        className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${
                          c.isLowStock
                            ? "bg-red-50 border-red-200 text-red-700"
                            : "bg-gray-100 border-gray-200 text-gray-600"
                        }`}
                      >
                        {c.colorName} {c.stock}kg
                      </span>
                    ))}
                    {(fabric.colors?.length ?? 0) > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-500">
                        +{fabric.colors.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                    <p className="text-[10px] text-muted-foreground">
                      {fabric.colorCount} warna
                    </p>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
      </div>

      <FAB onClick={() => setIsDialogOpen(true)} label="Tambah Pembelian Kain" hidden={isDialogOpen} />

      <AddFabricPurchaseDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
