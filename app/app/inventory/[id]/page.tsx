"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FAB } from "@/components/fab";
import { AddFabricPurchaseDialog } from "@/components/dialogs/add-fabric-purchase-dialog";
import { DetailSkeleton } from "@/components/skeletons";
import {
  ArrowLeft,
  Boxes,
  History,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";

// ── Mock data (hapus setelah API siap) ──────────────────────────────────────
const MOCK_FABRICS: Record<string, {
  id: string;
  name: string;
  unit: string;
  reorderPoint: number;
  colors: Array<{
    id: string;
    colorName: string;
    stock: number;
    avgPrice: number;
    isLowStock: boolean;
    batches: Array<{
      id: string;
      supplierName: string;
      purchaseDate: string;
      qtyPurchased: number;
      qtyRemaining: number;
      pricePerKg: number;
    }>;
  }>;
}> = {
  "fabric-cotton-combed-30": {
    id: "fabric-cotton-combed-30",
    name: "Cotton Combed 30s",
    unit: "kg",
    reorderPoint: 5,
    colors: [
      {
        id: "color-1",
        colorName: "Putih",
        stock: 20,
        avgPrice: 52000,
        isLowStock: false,
        batches: [
          { id: "b1", supplierName: "Supplier A", purchaseDate: "2026-08-20", qtyPurchased: 20, qtyRemaining: 20, pricePerKg: 52000 },
          { id: "b2", supplierName: "Supplier A", purchaseDate: "2026-07-15", qtyPurchased: 15, qtyRemaining: 0, pricePerKg: 51000 },
        ],
      },
      {
        id: "color-2",
        colorName: "Hitam",
        stock: 15,
        avgPrice: 51000,
        isLowStock: false,
        batches: [
          { id: "b3", supplierName: "Supplier B", purchaseDate: "2026-08-10", qtyPurchased: 15, qtyRemaining: 15, pricePerKg: 51000 },
        ],
      },
      {
        id: "color-3",
        colorName: "Merah",
        stock: 3,
        avgPrice: 53000,
        isLowStock: true,
        batches: [
          { id: "b4", supplierName: "Supplier A", purchaseDate: "2026-08-05", qtyPurchased: 10, qtyRemaining: 3, pricePerKg: 53000 },
        ],
      },
    ],
  },
};

export default function InventoryDetailPage() {
  const params = useParams();
  const fabricId = params.id as string;
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);

  const fabric = MOCK_FABRICS[fabricId];

  if (!fabric) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6 text-center">
        <p className="text-muted-foreground">Kain tidak ditemukan</p>
        <Link href="/inventory" className="text-primary text-sm hover:underline">← Kembali ke Inventory</Link>
      </div>
    );
  }

  const totalStock = fabric.colors.reduce((s, c) => s + c.stock, 0);
  const selectedColor = fabric.colors.find((c) => c.id === selectedColorId);

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      {/* Back */}
      <Link href="/inventory" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mb-4">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Inventory
      </Link>

      {/* Header card */}
      <Card className="mb-4 card-shadow-lg bg-blue-100 border-2 border-blue-300 hover:shadow-xl hover:-translate-y-0.5 transition-all">
        <CardContent className="pt-4 pb-4">
          <p className="text-lg font-bold text-foreground mb-1">{fabric.name}</p>
          <div className="flex items-end gap-1 mb-3">
            <p className="text-3xl font-bold text-blue-700">{totalStock}</p>
            <p className="text-sm text-blue-600 mb-1">kg total</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <Boxes className="h-3.5 w-3.5" />
            <span>{fabric.colors.length} warna tersedia</span>
            <span>•</span>
            <span>Reorder point: {fabric.reorderPoint} kg</span>
          </div>
        </CardContent>
      </Card>

      {/* Stok per warna */}
      <Card className="mb-4 card-shadow-lg bg-gray-100 border-2 border-gray-300 hover:shadow-xl hover:-translate-y-0.5 transition-all">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Boxes className="h-4 w-4 text-primary" />
            Stok per Warna
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {fabric.colors.map((color) => {
            const pct = totalStock > 0 ? (color.stock / totalStock) * 100 : 0;
            return (
              <button
                key={color.id}
                type="button"
                onClick={() => setSelectedColorId(selectedColorId === color.id ? null : color.id)}
                className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
                  selectedColorId === color.id
                    ? "border-primary bg-blue-50"
                    : color.isLowStock
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {color.isLowStock && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                    <span className="text-sm font-semibold text-foreground">{color.colorName}</span>
                    {color.isLowStock && (
                      <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700 border-red-200">
                        Stok Menipis
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-base font-bold ${color.isLowStock ? "text-red-700" : "text-foreground"}`}>
                      {color.stock} kg
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${color.isLowStock ? "bg-red-500" : "bg-blue-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">
                    {formatRupiah(color.avgPrice)}/kg rata-rata
                  </span>
                  <span className="text-[10px] text-muted-foreground">{pct.toFixed(0)}% dari total</span>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Riwayat batch warna yang dipilih */}
      {selectedColor && (
        <Card className="mb-4 card-shadow-lg bg-gray-100 border-2 border-gray-300 hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Riwayat Pembelian — {selectedColor.colorName}
            </CardTitle>
            <Button
              size="sm"
              className="h-8 gap-1 bg-white text-primary border border-primary/40 hover:bg-blue-50 shadow-sm"
              onClick={() => setIsAddStockOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" /> Tambah
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {selectedColor.batches.map((batch) => (
              <div key={batch.id} className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-foreground">{batch.supplierName}</p>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] ${
                      batch.qtyRemaining === 0
                        ? "bg-gray-100 text-gray-500"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {batch.qtyRemaining === 0 ? "Habis" : `${batch.qtyRemaining} kg sisa`}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatDate(batch.purchaseDate)}</span>
                  <span>•</span>
                  <span>Beli: {batch.qtyPurchased} kg</span>
                  <span>•</span>
                  <span>{formatRupiah(batch.pricePerKg)}/kg</span>
                </div>
                {batch.qtyRemaining > 0 && (
                  <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded-full"
                      style={{ width: `${(batch.qtyRemaining / batch.qtyPurchased) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* FAB */}
      <FAB
        onClick={() => setIsAddStockOpen(true)}
        label="Tambah Stok"
        hidden={isAddStockOpen}
      />

      {/* Dialog tambah stok — prefill fabric + warna yang dipilih */}
      <AddFabricPurchaseDialog
        open={isAddStockOpen}
        onOpenChange={setIsAddStockOpen}
        initialFabricId={fabric.id}
        initialColorName={selectedColor?.colorName}
        initialPricePerKg={selectedColor?.avgPrice}
      />
    </div>
  );
}
