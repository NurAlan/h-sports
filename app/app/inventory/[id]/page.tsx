"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  History,
  Boxes,
  Pencil,
} from "lucide-react";
import { FAB } from "@/components/fab";
import { AddFabricPurchaseDialog } from "@/components/dialogs/add-fabric-purchase-dialog";
import { api, type Fabric, type FabricBatch } from "@/lib/api";
import { DetailSkeleton } from "@/components/skeletons";
import { formatRupiah, formatDate } from "@/lib/utils";
import { useToast } from "@/components/toast/toast-provider";

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

export default function InventoryDetailPage() {
  const params = useParams<{ id: string }>();
  const toast = useToast();

  const [fabric, setFabric] = useState<Fabric | null>(null);
  const [batches, setBatches] = useState<FabricBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<FabricBatch | null>(null);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    supplierName: "",
    purchaseDate: "",
    qtyPurchased: "",
    qtyRemaining: "",
    pricePerKg: "",
  });

  useEffect(() => {
    Promise.all([
      api.get<Fabric>(`/api/fabrics/${params.id}`),
      api.get<FabricBatch[]>(`/api/fabric-batches?fabricId=${params.id}`),
    ])
      .then(([fabricData, batchData]) => {
        setFabric(fabricData);
        setBatches(batchData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const stock = batches.reduce((s, b) => s + b.qtyRemaining, 0);
  const totalValue = batches.reduce((s, b) => s + b.qtyRemaining * b.pricePerKg, 0);
  const avgPrice = stock > 0 ? totalValue / stock : 0;
  const isLowStock = fabric ? stock <= fabric.reorderPoint : false;

  const sortedBatches = useMemo(
    () => [...batches].sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate)),
    [batches]
  );

  const openEdit = (batch: FabricBatch) => {
    setEditTarget(batch);
    setEditForm({
      supplierName: batch.supplierName,
      purchaseDate: batch.purchaseDate,
      qtyPurchased: String(batch.qtyPurchased),
      qtyRemaining: String(batch.qtyRemaining),
      pricePerKg: String(batch.pricePerKg),
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    try {
      await api.patch(`/api/fabric-batches/${editTarget.id}`, {
        supplierName: editForm.supplierName,
        purchaseDate: editForm.purchaseDate,
        qtyPurchased: parseFloat(editForm.qtyPurchased) || 0,
        qtyRemaining: parseFloat(editForm.qtyRemaining) || 0,
        pricePerKg: parseFloat(editForm.pricePerKg) || 0,
      });

      setBatches((prev) =>
        prev.map((b) =>
          b.id === editTarget.id
            ? {
                ...b,
                supplierName: editForm.supplierName,
                purchaseDate: editForm.purchaseDate,
                qtyPurchased: parseFloat(editForm.qtyPurchased) || 0,
                qtyRemaining: parseFloat(editForm.qtyRemaining) || 0,
                pricePerKg: parseFloat(editForm.pricePerKg) || 0,
              }
            : b
        )
      );
      toast.success("Data batch berhasil diperbarui");
      setEditTarget(null);
    } catch (err) {
      toast.error(`Gagal menyimpan: ${(err as Error).message}`);
    }
  };

  const fabricName = fabric?.name ?? "Tidak ditemukan";

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

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <Link
        href="/inventory"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Inventory
      </Link>

      {/* Header */}
      <div
        className={`rounded-2xl border-2 p-5 mb-4 card-shadow-lg ${
          isLowStock ? "bg-red-100 border-red-300" : "bg-blue-100 border-blue-300"
        }`}
      >
        <p className="text-lg font-bold text-foreground mb-1">{fabric.name}</p>
        <div className="flex items-end gap-1 mb-2">
          <p className={`text-3xl font-bold ${isLowStock ? "text-red-600" : "text-blue-700"}`}>
            {stock.toLocaleString("id-ID")}
          </p>
          <p className="text-sm text-muted-foreground mb-1">{fabric.unit}</p>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Harga rata-rata: {formatRupiah(avgPrice)}/{fabric.unit}</span>
          <span>Nilai stok: {formatRupiah(totalValue)}</span>
        </div>
        {isLowStock && (
          <Badge variant="secondary" className="mt-2 bg-red-200 text-red-800">
            ⚠️ Di bawah reorder point ({fabric.reorderPoint} {fabric.unit})
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
          {sortedBatches.map((batch) => (
            <div
              key={batch.id}
              className="flex items-center justify-between gap-2 pb-3 border-b border-border/60 last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {formatDate(batch.purchaseDate)}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {batch.supplierName} • {batch.qtyPurchased} {fabric.unit}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">
                    {formatRupiah(batch.pricePerKg)}
                  </p>
                  <p className="text-xs text-muted-foreground">/kg</p>
                </div>
                <button
                  type="button"
                  onClick={() => openEdit(batch)}
                  aria-label="Edit batch"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {sortedBatches.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada pembelian
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sisa Bahan */}
      <Card className="card-shadow-lg bg-white border-gray-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Boxes className="h-4 w-4 text-primary" />
            Sisa Bahan per Batch
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedBatches.map((batch) => {
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
                  <Badge variant="secondary" className={`text-[11px] ${status.badge}`}>
                    {status.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1.5">
                  Sisa {batch.qtyRemaining.toLocaleString("id-ID")} {fabric.unit} dari{" "}
                  {batch.qtyPurchased} {fabric.unit} beli
                </p>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${status.bar}`}
                    style={{ width: `${Math.max(status.pct, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
          {sortedBatches.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada batch
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dialog edit batch */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Data Batch</DialogTitle>
            <DialogDescription>
              Perbaiki data pembelian kain jika ada kesalahan input
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Supplier</Label>
                <Input
                  value={editForm.supplierName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, supplierName: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Tanggal Beli</Label>
                <Input
                  type="date"
                  value={editForm.purchaseDate}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, purchaseDate: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Qty Beli (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editForm.qtyPurchased}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, qtyPurchased: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Sisa Stok (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max={editForm.qtyPurchased}
                    value={editForm.qtyRemaining}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, qtyRemaining: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Harga per kg (Rp)</Label>
                <CurrencyInput
                  value={editForm.pricePerKg}
                  onChange={(val) =>
                    setEditForm((f) => ({ ...f, pricePerKg: val }))
                  }
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="default" onClick={() => setEditTarget(null)}>
                Batal
              </Button>
              <Button type="submit" variant="outline" className="text-primary border-primary/40 hover:bg-blue-50">
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Tambah Stok — auto-fill dari data inventory */}
      <AddFabricPurchaseDialog
        open={isAddStockOpen}
        onOpenChange={setIsAddStockOpen}
        initialFabricId={fabric.id}
        initialPricePerKg={avgPrice}
        initialSupplierName={batches[0]?.supplierName}
      />

      {/* FAB Tambah Stok — konsisten dengan halaman lain */}
      <FAB onClick={() => setIsAddStockOpen(true)} label="Tambah Stok" />
    </div>
  );
}