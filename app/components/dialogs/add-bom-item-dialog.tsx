"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { FABRIC_CATALOG, getFabricCatalogById } from "@/lib/master-data";
import { api, type BomItem } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";

interface AddBOMItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
  /** Dipanggil setelah bahan berhasil ditambah — data langsung tampil tanpa reload */
  onAdded?: (item: BomItem) => void;
}

export function AddBOMItemDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  onAdded,
}: AddBOMItemDialogProps) {
  const [fabricId, setFabricId] = useState("");
  const [qtyRequired, setQtyRequired] = useState("");
  const [wastePercentage, setWastePercentage] = useState("10");
  const [stockMap, setStockMap] = useState<
    Record<string, { stock: number; avgPrice: number }>
  >({});
  const [stockLoading, setStockLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch stok REAL dari API saat dialog dibuka (bukan mock)
  useEffect(() => {
    if (open) {
      setStockLoading(true);
      api
        .get<{ id: string; stock: number; avgPrice: number }[]>("/api/inventory")
        .then((items) => {
          const map: Record<string, { stock: number; avgPrice: number }> = {};
          for (const it of items) map[it.id] = { stock: it.stock, avgPrice: it.avgPrice };
          setStockMap(map);
        })
        .catch(() => setStockMap({}))
        .finally(() => setStockLoading(false));
    }
  }, [open]);

  const selectedFabric = useMemo(
    () => getFabricCatalogById(fabricId),
    [fabricId]
  );
  const stock = fabricId ? stockMap[fabricId]?.stock ?? 0 : 0;
  const avgPrice = fabricId ? stockMap[fabricId]?.avgPrice ?? 0 : 0;

  const qtyRequiredNum = parseFloat(qtyRequired) || 0;
  const wasteNum = parseFloat(wastePercentage) || 0;
  const qtyActual = qtyRequiredNum * (1 + wasteNum / 100);
  const materialCost = qtyActual * avgPrice;
  const isStockEnough = stock >= qtyActual;

  // Hanya kain yang stoknya > 0 yang bisa ditambahkan ke BOM
  const availableFabrics = useMemo(
    () => FABRIC_CATALOG.filter((f) => (stockMap[f.id]?.stock ?? 0) > 0),
    [stockMap]
  );

  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await api.post<BomItem>(`/api/orders/${orderId}/bom`, {
        fabricId,
        qtyRequired: qtyRequiredNum,
        wastePercentage: wasteNum,
      });
      setFabricId("");
      setQtyRequired("");
      setWastePercentage("10");
      onOpenChange(false);
      toast.success(`Bahan ${selectedFabric?.name} ditambahkan ke BOM`);
      onAdded?.(created);
    } catch (err) {
      toast.error(`Gagal: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Bahan ke BOM</DialogTitle>
          <DialogDescription>
            {orderNumber} — Pilih kain dan kebutuhan bersih
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Fabric */}
            <div className="grid gap-2">
              <Label>Jenis Kain *</Label>
              <Select
                value={fabricId}
                onValueChange={(val) => setFabricId(val || "")}
                disabled={stockLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={stockLoading ? "Memuat stok..." : "Pilih kain"} />
                </SelectTrigger>
                <SelectContent>
                  {availableFabrics.length === 0 && !stockLoading ? (
                    <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                      Semua stok habis — tambah stok dulu
                    </p>
                  ) : (
                    availableFabrics.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name} (stok {stockMap[f.id]?.stock ?? 0} kg)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedFabric && (
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Stok tersedia</span>
                    <span className={isStockEnough ? "text-green-600 font-medium" : "text-red-600 font-semibold"}>
                      {stock} kg
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Harga rata-rata</span>
                    <span>{formatRupiah(avgPrice)}/kg</span>
                  </div>
                </div>
              )}
            </div>

            {/* Qty Required */}
            <div className="grid gap-2">
              <Label htmlFor="qty">Kebutuhan Bersih (kg) *</Label>
              <Input
                id="qty"
                type="number"
                step="0.1"
                min="0"
                placeholder="Contoh: 10"
                value={qtyRequired}
                onChange={(e) => setQtyRequired(e.target.value)}
                required
              />
            </div>

            {/* Waste */}
            <div className="grid gap-2">
              <Label htmlFor="waste">Persentase Waste (%)</Label>
              <Input
                id="waste"
                type="number"
                step="1"
                min="0"
                max="100"
                value={wastePercentage}
                onChange={(e) => setWastePercentage(e.target.value)}
              />
            </div>

            {selectedFabric && qtyRequiredNum > 0 && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Qty actual (+ waste)</span>
                  <span className="font-medium">{qtyActual.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Harga rata-rata</span>
                  <span>{formatRupiah(avgPrice)}/kg</span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-gray-200">
                  <span className="font-semibold">Estimasi Biaya</span>
                  <span className="font-bold text-primary">{formatRupiah(materialCost)}</span>
                </div>
                {!isStockEnough && (
                  <p className="text-xs text-red-600 font-medium">
                    ⚠️ Stok tidak cukup ({stock} kg tersedia)
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Batal</Button>
            <Button type="submit" disabled={!fabricId || qtyRequiredNum <= 0 || loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Menambahkan...
                </span>
              ) : "Tambah Bahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
