"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { MenuGuide } from "@/components/tutorial/menu-guide";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FAB } from "@/components/fab";
import { ChevronRight, AlertTriangle, Search, Package } from "lucide-react";
import { AddFabricPurchaseDialog } from "@/components/dialogs/add-fabric-purchase-dialog";
import { formatRupiah } from "@/lib/utils";

// ── Mock data (hapus setelah API siap) ──────────────────────────────────────
const MOCK_INVENTORY = [
  {
    id: "fabric-cotton-combed-30",
    name: "Cotton Combed 30s",
    unit: "kg",
    reorderPoint: 5,
    totalStock: 42.5,
    colors: [
      { colorName: "Putih", stock: 20, avgPrice: 52000 },
      { colorName: "Hitam", stock: 15, avgPrice: 51000 },
      { colorName: "Merah", stock: 7.5, avgPrice: 53000 },
    ],
    isLowStock: false,
    lastPurchase: "2026-08-20",
  },
  {
    id: "fabric-cotton-combed-24",
    name: "Cotton Combed 24s",
    unit: "kg",
    reorderPoint: 5,
    totalStock: 3.2,
    colors: [
      { colorName: "Putih", stock: 3.2, avgPrice: 48000 },
    ],
    isLowStock: true,
    lastPurchase: "2026-08-10",
  },
  {
    id: "fabric-cotton-bamboo",
    name: "Cotton Bamboo",
    unit: "kg",
    reorderPoint: 5,
    totalStock: 18,
    colors: [
      { colorName: "Abu-abu", stock: 10, avgPrice: 65000 },
      { colorName: "Navy", stock: 8, avgPrice: 66000 },
    ],
    isLowStock: false,
    lastPurchase: "2026-08-18",
  },
  {
    id: "fabric-polyester",
    name: "Polyester",
    unit: "kg",
    reorderPoint: 5,
    totalStock: 25,
    colors: [
      { colorName: "Putih", stock: 25, avgPrice: 35000 },
    ],
    isLowStock: false,
    lastPurchase: "2026-08-15",
  },
  {
    id: "fabric-spandex",
    name: "Spandex / Lycra",
    unit: "kg",
    reorderPoint: 5,
    totalStock: 4,
    colors: [
      { colorName: "Hitam", stock: 4, avgPrice: 120000 },
    ],
    isLowStock: true,
    lastPurchase: "2026-07-30",
  },
  {
    id: "fabric-rayon",
    name: "Rayon / Viscose",
    unit: "kg",
    reorderPoint: 5,
    totalStock: 12,
    colors: [
      { colorName: "Putih", stock: 6, avgPrice: 42000 },
      { colorName: "Kuning", stock: 6, avgPrice: 43000 },
    ],
    isLowStock: false,
    lastPurchase: "2026-08-12",
  },
];

export default function InventoryPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MOCK_INVENTORY;
    return MOCK_INVENTORY.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.colors.some((c) => c.colorName.toLowerCase().includes(q))
    );
  }, [search]);

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <PageHeader
        title="Inventory"
        subtitle="Stok kain & warna"
        action={<MenuGuide menuKey="inventory" />}
      />

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

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.length === 0 && !search && (
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
        {filtered.length === 0 && search && (
          <div className="col-span-2 text-center py-8">
            <p className="text-sm text-muted-foreground">Tidak ada kain yang cocok dengan &quot;{search}&quot;</p>
          </div>
        )}

        {filtered.map((fabric) => (
          <Link key={fabric.id} href={`/inventory/${fabric.id}`} className="h-full">
            <Card
              className={`h-full border card-shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all ${
                fabric.isLowStock
                  ? "border-red-300 bg-red-100"
                  : "border-gray-300 bg-white"
              }`}
            >
              <CardContent className="p-4 flex flex-col">
                {/* Nama kain */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {fabric.name}
                  </p>
                  {fabric.isLowStock && (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                  )}
                </div>

                {/* Total stok */}
                <p className={`text-xl font-bold mb-0.5 ${fabric.isLowStock ? "text-red-700" : "text-foreground"}`}>
                  {fabric.totalStock} <span className="text-sm font-normal">kg</span>
                </p>

                {/* Warna chips */}
                <div className="flex flex-wrap gap-1 mt-2 mb-2">
                  {fabric.colors.slice(0, 3).map((c) => (
                    <span
                      key={c.colorName}
                      className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${
                        c.stock <= 2
                          ? "bg-red-50 border-red-200 text-red-700"
                          : "bg-gray-100 border-gray-200 text-gray-600"
                      }`}
                    >
                      {c.colorName} {c.stock}kg
                    </span>
                  ))}
                  {fabric.colors.length > 3 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-500">
                      +{fabric.colors.length - 3}
                    </span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                  <p className="text-[10px] text-muted-foreground">
                    {fabric.colors.length} warna
                  </p>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <FAB
        onClick={() => setIsDialogOpen(true)}
        label="Tambah Pembelian Kain"
        hidden={isDialogOpen}
      />

      <AddFabricPurchaseDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
