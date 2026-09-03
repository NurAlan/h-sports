"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogBody,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/toast/toast-provider";
import { api, type BomItem } from "@/lib/api";
import { formatRupiah, formatDate } from "@/lib/utils";

interface AddBOMItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
  existingBatchIds?: string[];
  onAdded?: (item: BomItem) => void;
}

interface BatchData {
  id: string;
  supplierName: string;
  purchaseDate: string;
  qtyRemaining: number;
  pricePerKg: number;
}

interface InventoryColor {
  colorId: string;
  colorName: string;
  stock: number;
  avgPrice: number;
}

interface InventoryFabric {
  id: string;
  name: string;
  totalStock: number;
  colors: InventoryColor[];
}

interface FabricDetail {
  id: string;
  name: string;
  colors: Array<{
    id: string;
    colorName: string;
    batches: BatchData[];
  }>;
}

export function AddBOMItemDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  existingBatchIds = [],
  onAdded,
}: AddBOMItemDialogProps) {
  const [fabricId, setFabricId] = useState("");
  const [colorId, setColorId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [qtyRequired, setQtyRequired] = useState("");
  const [inventory, setInventory] = useState<InventoryFabric[]>([]);
  const [fabricDetail, setFabricDetail] = useState<FabricDetail | null>(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Fetch inventory saat dialog dibuka
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStockLoading(true);
      api
        .get<InventoryFabric[]>("/api/inventory")
        .then((data) => {
          setInventory(data.filter((f) => f.totalStock > 0));
        })
        .catch(() => setInventory([]))
        .finally(() => setStockLoading(false));
    } else {
      // Reset saat dialog ditutup
      setFabricId("");
      setColorId("");
      setBatchId("");
      setQtyRequired("");
      setFabricDetail(null);
    }
  }, [open]);

  // Fetch fabric detail (batches) saat fabric dipilih
  useEffect(() => {
    if (fabricId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBatchLoading(true);
      api
        .get<FabricDetail>(`/api/fabrics/${fabricId}`)
        .then((data) => {
          setFabricDetail(data);
        })
        .catch(() => setFabricDetail(null))
        .finally(() => setBatchLoading(false));
    } else {
      setFabricDetail(null);
    }
  }, [fabricId]);

  // Warna tersedia dari fabric terpilih
  const availableColors = useMemo(() => {
    if (!fabricDetail) return [];
    return fabricDetail.colors.filter((c) => c.batches.some((b) => b.qtyRemaining > 0));
  }, [fabricDetail]);

  // Warna terpilih
  const selectedColor = useMemo(() => {
    return availableColors.find((c) => c.id === colorId);
  }, [availableColors, colorId]);

  // Batch tersedia untuk warna terpilih (sorted by purchaseDate DESC - terbaru dulu)
  const availableBatches = useMemo(() => {
    if (!selectedColor) return [];
    return selectedColor.batches
      .filter((b) => b.qtyRemaining > 0)
      .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  }, [selectedColor]);

  // Batch terpilih
  const selectedBatch = useMemo(() => {
    return availableBatches.find((b) => b.id === batchId);
  }, [availableBatches, batchId]);

  // Kalkulasi qty dan biaya bahan
  const qtyRequiredNum = parseFloat(qtyRequired) || 0;
  const materialCost = qtyRequiredNum * (selectedBatch?.pricePerKg ?? 0);
  const isStockEnough = selectedBatch ? selectedBatch.qtyRemaining >= qtyRequiredNum : false;
  const isDuplicate = !!batchId && existingBatchIds.includes(batchId);

  const handleFabricChange = (val: string) => {
    setFabricId(val);
    setColorId("");
    setBatchId("");
  };

  const handleColorChange = (val: string) => {
    setColorId(val);
    setBatchId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fabricId || !colorId || !batchId || qtyRequiredNum <= 0) return;
    if (isDuplicate) {
      toast.error("Batch pembelian ini sudah ada di BOM — gunakan Edit untuk mengubah jumlahnya");
      return;
    }
    if (!isStockEnough) {
      toast.error(`Stok batch tidak cukup: sisa ${selectedBatch?.qtyRemaining.toFixed(1)} kg`);
      return;
    }

    setLoading(true);
    try {
      const created = await api.post<BomItem>(`/api/orders/${orderId}/bom`, {
        fabricId,
        fabricColorId: colorId,
        batchId,
        qtyRequired: qtyRequiredNum,
      });
      toast.success(`Bahan ditambahkan ke order ${orderNumber}`);
      onAdded?.(created);
      onOpenChange(false);
      // Reset form
      setFabricId("");
      setColorId("");
      setBatchId("");
      setQtyRequired("");
    } catch (err) {
      toast.error(`Gagal tambah bahan: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pilih Bahan &amp; Batch Stok</DialogTitle>
          <DialogDescription>
            Order <b>{orderNumber}</b> — Pilih jenis kain, warna, tanggal pembelian stok, dan jumlah yang dibutuhkan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <DialogBody>
            <div className="grid gap-4">
              {/* Step 1 — Pilih Kain */}
              <div className="grid gap-1.5">
                <Label>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-sm">
                    <span className="h-4 w-4 rounded-full bg-primary text-[10px] text-white font-bold flex items-center justify-center">
                      1
                    </span>
                    Jenis Kain *
                  </span>
                </Label>
                <Select value={fabricId} onValueChange={handleFabricChange} disabled={stockLoading}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={stockLoading ? "Memuat data kain..." : "Pilih jenis kain..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {inventory.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name} ({f.totalStock} kg total)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Step 2 — Pilih Warna */}
              {fabricId && (
                <div className="grid gap-1.5">
                  <Label>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-sm">
                      <span className="h-4 w-4 rounded-full bg-primary text-[10px] text-white font-bold flex items-center justify-center">
                        2
                      </span>
                      Warna Kain *
                    </span>
                  </Label>
                  <Select value={colorId} onValueChange={handleColorChange} disabled={batchLoading}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={batchLoading ? "Memuat warna..." : "Pilih warna kain..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColors.map((c) => {
                        const totalStock = c.batches.reduce((sum, b) => sum + b.qtyRemaining, 0);
                        return (
                          <SelectItem key={c.id} value={c.id}>
                            {c.colorName} ({totalStock.toFixed(1)} kg tersedia)
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Step 3 — Pilih Batch (dengan tanggal beli + harga) */}
              {colorId && (
                <div className="grid gap-1.5">
                  <Label>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-sm">
                      <span className="h-4 w-4 rounded-full bg-primary text-[10px] text-white font-bold flex items-center justify-center">
                        3
                      </span>
                      Pilih Stok (Tanggal Pembelian &amp; Harga) *
                    </span>
                  </Label>
                  <Select value={batchId} onValueChange={setBatchId}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Pilih tanggal pembelian batch..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBatches.map((b) => {
                        const isAlreadyInBom = existingBatchIds.includes(b.id);
                        return (
                          <SelectItem key={b.id} value={b.id} disabled={isAlreadyInBom}>
                            {formatDate(b.purchaseDate)} — {formatRupiah(b.pricePerKg)}/kg (sisa: {b.qtyRemaining.toFixed(1)} kg)
                            {isAlreadyInBom ? " [Sudah ada di BOM]" : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {/* Info batch terpilih */}
                  {selectedBatch && (
                    <div className="rounded-lg bg-blue-50/60 border border-blue-200 p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tanggal Pembelian:</span>
                        <span className="font-semibold text-foreground">{formatDate(selectedBatch.purchaseDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Supplier:</span>
                        <span className="font-medium text-foreground">{selectedBatch.supplierName || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Harga Beli Kain:</span>
                        <span className="font-bold text-primary">{formatRupiah(selectedBatch.pricePerKg)}/kg</span>
                      </div>
                      <div className="flex justify-between border-t border-blue-200/80 pt-1">
                        <span className="text-muted-foreground">Sisa Stok Batch:</span>
                        <span className="font-bold text-green-700">{selectedBatch.qtyRemaining.toFixed(1)} kg</span>
                      </div>
                    </div>
                  )}

                  {isDuplicate && (
                    <div className="rounded-lg bg-amber-50 border border-amber-300 px-3 py-2">
                      <p className="text-xs font-medium text-amber-800">
                        ⚠️ Batch ini sudah ada di BOM. Gunakan tombol <b>Edit</b> di list untuk mengubah jumlah.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4 — Input Jumlah (kg) */}
              {batchId && (
                <div className="grid gap-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="qty">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-sm">
                        <span className="h-4 w-4 rounded-full bg-primary text-[10px] text-white font-bold flex items-center justify-center">
                          4
                        </span>
                        Jumlah Satuan yang Dibutuhkan (kg) *
                      </span>
                    </Label>
                    <Input
                      id="qty"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max={selectedBatch ? selectedBatch.qtyRemaining : undefined}
                      placeholder={`Maksimal ${selectedBatch?.qtyRemaining.toFixed(1)} kg`}
                      value={qtyRequired}
                      onChange={(e) => setQtyRequired(e.target.value)}
                      className="h-10 text-base"
                      required
                    />
                  </div>

                  {qtyRequiredNum > 0 && (
                    <div className="rounded-lg bg-stone-50 border border-stone-200 p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Jumlah Kebutuhan:</span>
                        <span className="font-semibold">{qtyRequiredNum.toFixed(1)} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Harga Batch:</span>
                        <span>{formatRupiah(selectedBatch?.pricePerKg ?? 0)}/kg</span>
                      </div>
                      <div className="flex justify-between text-sm pt-1.5 border-t border-stone-200">
                        <span className="font-bold text-foreground">Total Biaya Bahan:</span>
                        <span className="font-extrabold text-primary">{formatRupiah(materialCost)}</span>
                      </div>
                      {!isStockEnough && (
                        <p className="text-xs text-red-600 font-semibold pt-1">
                          ⚠️ Melebihi stok batch! Tersedia hanya {selectedBatch?.qtyRemaining.toFixed(1)} kg.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogBody>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={
                !fabricId ||
                !colorId ||
                !batchId ||
                qtyRequiredNum <= 0 ||
                loading ||
                isDuplicate ||
                !isStockEnough
              }
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Menambahkan...
                </span>
              ) : (
                "Tambah Bahan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
