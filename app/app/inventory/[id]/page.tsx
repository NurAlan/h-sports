import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, History, Boxes } from "lucide-react";
import {
  getFabricById,
  fabricBatches,
  getFabricStock,
  getFabricAvgPrice,
} from "@/lib/mock-data";
import { formatRupiah, formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

/** Status sisa stok per batch berdasarkan rasio sisa/beli */
function getBatchStatus(remaining: number, purchased: number) {
  if (remaining <= 0) {
    return { label: "Habis", badge: "bg-red-200 text-red-800", bar: "bg-red-500", pct: 0 };
  }
  const ratio = remaining / purchased;
  if (ratio <= 0.25) {
    return { label: "Stok Tipis", badge: "bg-red-100 text-red-700", bar: "bg-red-500", pct: ratio * 100 };
  }
  if (ratio <= 0.5) {
    return { label: "Menipis", badge: "bg-amber-100 text-amber-800", bar: "bg-amber-500", pct: ratio * 100 };
  }
  return { label: "Aman", badge: "bg-green-100 text-green-800", bar: "bg-green-500", pct: ratio * 100 };
}

export default async function InventoryDetailPage({ params }: Props) {
  const { id } = await params;
  const fabric = getFabricById(id);
  if (!fabric) notFound();

  const batches = fabricBatches
    .filter((b) => b.fabricId === id)
    .sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate)); // terbaru dulu

  const stock = getFabricStock(id);
  const avgPrice = getFabricAvgPrice(id);
  const stockValue = stock * avgPrice;
  const isLowStock = stock <= fabric.reorderPoint;

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      {/* Back button */}
      <Link
        href="/inventory"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Inventory
      </Link>

      {/* Header fabric */}
      <div
        className={`rounded-2xl border-2 p-5 mb-4 card-shadow-lg ${
          isLowStock
            ? "bg-red-100 border-red-300"
            : "bg-blue-100 border-blue-300"
        }`}
      >
        <p className="text-lg font-bold text-foreground mb-1">{fabric.name}</p>
        <div className="flex items-end gap-1 mb-2">
          <p
            className={`text-3xl font-bold ${
              isLowStock ? "text-red-600" : "text-blue-700"
            }`}
          >
            {stock.toLocaleString("id-ID")}
          </p>
          <p className="text-sm text-muted-foreground mb-1">{fabric.unit}</p>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Harga rata-rata: {formatRupiah(avgPrice)}/{fabric.unit}</span>
          <span>Nilai stok: {formatRupiah(stockValue)}</span>
        </div>
        {isLowStock && (
          <Badge
            variant="secondary"
            className="mt-2 bg-red-200 text-red-800"
          >
            ⚠️ Di bawah reorder point ({fabric.reorderPoint} {fabric.unit}) — segera beli
          </Badge>
        )}
      </div>

      {/* Riwayat Harga */}
      <Card className="mb-4 card-shadow-lg bg-white border-gray-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Riwayat Harga (Harga Kulak)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className="flex items-center justify-between pb-3 border-b border-border/60 last:border-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(batch.purchaseDate)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {batch.supplierName} • {batch.qtyPurchased} {fabric.unit}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">
                  {formatRupiah(batch.pricePerKg)}
                </p>
                <p className="text-xs text-muted-foreground">/kg</p>
              </div>
            </div>
          ))}
          {batches.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada pembelian
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sisa Bahan per Batch */}
      <Card className="card-shadow-lg bg-white border-gray-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Boxes className="h-4 w-4 text-primary" />
            Sisa Bahan per Batch
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {batches.map((batch) => {
            const status = getBatchStatus(batch.qtyRemaining, batch.qtyPurchased);
            return (
              <div
                key={batch.id}
                className="pb-3 border-b border-border/60 last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-medium text-foreground">
                    Batch {formatDate(batch.purchaseDate)}
                  </p>
                  <Badge
                    variant="secondary"
                    className={`text-[11px] ${status.badge}`}
                  >
                    {status.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1.5">
                  Sisa {batch.qtyRemaining.toLocaleString("id-ID")} {fabric.unit}{" "}
                  dari {batch.qtyPurchased} {fabric.unit} beli
                </p>
                {/* Progress bar sisa stok */}
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${status.bar}`}
                    style={{ width: `${Math.max(status.pct, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
          {batches.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada batch
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
