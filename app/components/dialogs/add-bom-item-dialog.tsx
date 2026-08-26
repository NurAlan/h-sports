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
import { FABRIC_CATALOG } from "@/lib/master-data";
import { api, type BomItem } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";

interface AddBOMItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
  onAdded?: (item: BomItem) => void;
}

// Tipe data inventory per FabricColor (dari /api/inventory)
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

export function AddBOMItemDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  onAdded,
}: AddBOMItemDialogProps) {
  const [fabricId, setFabricId] = useState("");
  const [colorId, setColorId] = useState("");
  const [qtyRequired, setQtyRequired] = useState("");
  const [wastePercentage, setWastePercentage] = useState("10");
  const [inventory, setInventory] = useState<InventoryFabric[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Fetch inventory saat dialog dibuka — API real (stok per FabricColor)
  useEffect(() => {
    if (open) {
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
      setQtyRequired("");
      setWastePercentage("10");
    }
  }, [open]);

  // Fabric yang dipilih
  const selectedFabric = useMemo(
    () => inventory.find((f) => f.id === fabricId),
    [inventory, fabricId]
  );

  // Warna yang tersedia untuk fabric terpilih (stok > 0)
  const availableColors = useMemo(
    () => selectedFabric?.colors.filter((c) => c.stock > 0) ?? [],
    [selectedFabric]
  );

  // Warna yang dipilih
  const selectedColor = useMemo(
    () => availableColors.find((c) => c.colorId === colorId),
    [availableColors, colorId]
  );

  const qtyRequiredNum = parseFloat(qtyRequired) || 0;
  const wasteNum = parseFloat(wastePercentage) || 0;
  const qtyActual = qtyRequiredNum * (1 + wasteNum / 100);
  const materialCost = qtyActual * (selectedColor?.avgPrice ?? 0);
  const isStockEnough = (selectedColor?.stock ?? 0) >= qtyActual;

  // Reset colorId saat fabric berubah
  const handleFabricChange = (val: string) => {
    setFabricId(val || "");
    setColorId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await api.post<BomItem>(`/api/orders/${orderId}/bom`, {
        fabricId,
        fabricColorId: colorId,
        qtyRequired: qtyRequiredNum,
        wastePercentage: wasteNum,
      });
      setFabricId("");
      setColorId("");
      setQtyRequired("");
      setWastePercentage("10");
      onOpenChange(false);
      toast.success(`Bahan ${selectedFabric?.name} — ${selectedColor?.colorName} ditambahkan ke BOM`);
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
            {orderNumber} — Pilih kain, warna, dan kebutuhan bersih
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody>
          <div className="grid gap-4">

            {/* Step 1 — Pilih Jenis Kain */}
            <div className="grid gap-2">
              <Label>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-4 w-4 rounded-full bg-primary text-[10px] text-white font-bold flex items-center justify-center">1</span>
                  Jenis Kain *
                </span>
              </Label>
              <Select
                value={fabricId}
                onValueChange={handleFabricChange}
                disabled={stockLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={stockLoading ? "Memuat stok..." : "Pilih jenis kain"} />
                </SelectTrigger>
                <SelectContent>
                  {inventory.length === 0 && !stockLoading ? (
                    <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                      Semua stok habis — tambah stok dulu
                    </p>
                  ) : (
                    inventory.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name} ({f.totalStock} kg total)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Step 2 — Pilih Warna (muncul setelah fabric dipilih) */}
            {fabricId && (
              <div className="grid gap-2">
                <Label>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-4 w-4 rounded-full bg-primary text-[10px] text-white font-bold flex items-center justify-center">2</span>
                    Warna *
                  </span>
                </Label>
                <Select
                  value={colorId}
                  onValueChange={(val) => setColorId(val || "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih warna" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColors.length === 0 ? (
                      <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                        Semua warna stok habis
                      </p>
                    ) : (
                      availableColors.map((c) => (
                        <SelectItem key={c.colorId} value={c.colorId}>
                          {c.colorName} ({c.stock} kg · {formatRupiah(c.avgPrice)}/kg)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {/* Info warna terpilih */}
                {selectedColor && (
                  <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Stok tersedia</span>
                      <span className={isStockEnough ? "text-green-600 font-medium" : "text-red-600 font-semibold"}>
                        {selectedColor.stock} kg
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Harga rata-rata</span>
                      <span>{formatRupiah(selectedColor.avgPrice)}/kg</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3 — Qty & Waste (muncul setelah warna dipilih) */}
            {colorId && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="qty">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-4 w-4 rounded-full bg-primary text-[10px] text-white font-bold flex items-center justify-center">3</span>
                      Kebutuhan Bersih (kg) *
                    </span>
                  </Label>
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

                {qtyRequiredNum > 0 && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Qty actual (+ waste)</span>
                      <span className="font-medium">{qtyActual.toFixed(2)} kg</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Harga rata-rata</span>
                      <span>{formatRupiah(selectedColor?.avgPrice ?? 0)}/kg</span>
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t border-gray-200">
                      <span className="font-semibold">Estimasi Biaya</span>
                      <span className="font-bold text-primary">{formatRupiah(materialCost)}</span>
                    </div>
                    {!isStockEnough && (
                      <p className="text-xs text-red-600 font-medium">
                        ⚠️ Stok tidak cukup ({selectedColor?.stock} kg tersedia)
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

          </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={!fabricId || !colorId || qtyRequiredNum <= 0 || loading}>
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
