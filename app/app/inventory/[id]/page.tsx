"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { api } from "@/lib/api";
import { formatRupiah, formatDate } from "@/lib/utils";

interface BatchData {
  id: string;
  supplierName: string;
  purchaseDate: string;
  qtyPurchased: number;
  qtyRemaining: number;
  pricePerKg: number;
}

interface ColorData {
  id: string;
  colorName: string;
  isActive: boolean;
  batches: BatchData[];
}

interface FabricDetail {
  id: string;
  name: string;
  unit: string;
  reorderPoint: number;
  colors: ColorData[];
}

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fabricId = params.id as string;

  const [fabric, setFabric] = useState<FabricDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<FabricDetail>(`/api/fabrics/${fabricId}`)
      .then((data) => {
        setFabric(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [fabricId]);

  if (loading) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (!fabric) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6 text-center">
        <p className="text-muted-foreground">Kain tidak ditemukan</p>
        <Link href="/inventory" className="text-primary text-sm hover:underline">
          ← Kembali ke Inventory
        </Link>
      </div>
    );
  }

  // Aggregate stok per warna dari batches
  const colorsWithStock = fabric.colors.map((c) => {
    const stock = c.batches.reduce((s, b) => s + b.qtyRemaining, 0);
    const totalValue = c.batches.reduce((s, b) => s + b.qtyRemaining * b.pricePerKg, 0);
    const avgPrice = stock > 0 ? totalValue / stock : 0;
    return {
      ...c,
      stock: Math.round(stock * 10) / 10,
      avgPrice,
      isLowStock: stock > 0 && stock <= fabric.reorderPoint,
    };
  });

  const totalStock = colorsWithStock.reduce((s, c) => s + c.stock, 0);
  const selectedColor = colorsWithStock.find((c) => c.id === selectedColorId);

  const handleDialogSuccess = () => {
    // Refetch setelah pembelian berhasil
    api
      .get<FabricDetail>(`/api/fabrics/${fabricId}`)
      .then(setFabric)
      .catch(() => {});
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      {/* Back */}
      <Link
        href="/inventory"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mb-4"
      >
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
            <span>{colorsWithStock.length} warna tersedia</span>
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
          {colorsWithStock.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Belum ada warna — tambah pembelian pertama lewat tombol + di bawah
            </p>
          )}
          {colorsWithStock.map((color) => {
            const pct = totalStock > 0 ? (color.stock / totalStock) * 100 : 0;
            return (
              <button
                key={color.id}
                type="button"
                onClick={() =>
                  setSelectedColorId(selectedColorId === color.id ? null : color.id)
                }
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
                    {color.isLowStock && (
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <span className="text-sm font-semibold text-foreground">
                      {color.colorName}
                    </span>
                    {color.isLowStock && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-red-100 text-red-700 border-red-200"
                      >
                        Stok Menipis
                      </Badge>
                    )}
                  </div>
                  <span
                    className={`text-base font-bold ${
                      color.isLowStock ? "text-red-700" : "text-foreground"
                    }`}
                  >
                    {color.stock} kg
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      color.isLowStock ? "bg-red-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">
                    {formatRupiah(Math.round(color.avgPrice))}/kg rata-rata
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {pct.toFixed(0)}% dari total
                  </span>
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
              Riwayat — {selectedColor.colorName}
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
                  <p className="text-sm font-semibold text-foreground">
                    {batch.supplierName || "Tanpa supplier"}
                  </p>
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
      <FAB onClick={() => setIsAddStockOpen(true)} label="Tambah Stok" hidden={isAddStockOpen} />

      {/* Dialog tambah stok — prefill fabric + warna terpilih */}
      <AddFabricPurchaseDialog
        open={isAddStockOpen}
        onOpenChange={(open) => {
          setIsAddStockOpen(open);
          if (!open) handleDialogSuccess(); // refetch saat dialog ditutup
        }}
        initialFabricId={fabric.id}
        initialColorName={selectedColor?.colorName}
        initialPricePerKg={selectedColor ? Math.round(selectedColor.avgPrice) : undefined}
      />
    </div>
  );
}
