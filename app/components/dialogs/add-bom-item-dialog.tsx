"use client";

import { useMemo, useState } from "react";
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
import { FABRIC_CATALOG, getFabricCatalogById } from "@/lib/master-data";
import { getFabricAvgPrice, getFabricStock } from "@/lib/mock-data";
import { formatRupiah } from "@/lib/utils";

interface AddBOMItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
}

export function AddBOMItemDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
}: AddBOMItemDialogProps) {
  const [fabricId, setFabricId] = useState("");
  const [qtyRequired, setQtyRequired] = useState("");
  const [wastePercentage, setWastePercentage] = useState("10");

  const selectedFabric = useMemo(
    () => getFabricCatalogById(fabricId),
    [fabricId]
  );
  const avgPrice = fabricId ? getFabricAvgPrice(fabricId) : 0;
  const stock = fabricId ? getFabricStock(fabricId) : 0;

  const qtyRequiredNum = parseFloat(qtyRequired) || 0;
  const wasteNum = parseFloat(wastePercentage) || 0;
  const qtyActual = qtyRequiredNum * (1 + wasteNum / 100);
  const materialCost = qtyActual * avgPrice;
  const isStockEnough = stock >= qtyActual;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API call
    console.log({
      orderId,
      fabricId,
      fabricName: selectedFabric?.name,
      qtyRequired: qtyRequiredNum,
      wastePercentage: wasteNum,
      qtyActual,
      pricePerKg: avgPrice,
      materialCost,
    });
    setFabricId("");
    setQtyRequired("");
    setWastePercentage("10");
    onOpenChange(false);
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
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kain" />
                </SelectTrigger>
                <SelectContent>
                  {FABRIC_CATALOG.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name} (stok {getFabricStock(f.id)} kg)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedFabric && (
                <p className="text-xs text-muted-foreground">
                  Stok: <span className={isStockEnough ? "text-green-600" : "text-red-600 font-semibold"}>{stock} kg</span> • Harga: {formatRupiah(avgPrice)}/kg
                </p>
              )}
            </div>

            {/* Qty Required */}
            <div className="grid gap-2">
              <Label htmlFor="qty">Kebutuhan Bersih (kg) *</Label>
              <Input
                id="qty"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="15"
                value={qtyRequired}
                onChange={(e) => setQtyRequired(e.target.value)}
                required
              />
            </div>

            {/* Waste */}
            <div className="grid gap-2">
              <Label htmlFor="waste">Waste / Sisa Potongan (%)</Label>
              <Input
                id="waste"
                type="number"
                step="0.5"
                min="0"
                max="100"
                placeholder="10"
                value={wastePercentage}
                onChange={(e) => setWastePercentage(e.target.value)}
              />
            </div>

            {/* Preview perhitungan */}
            {qtyRequiredNum > 0 && (
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Kebutuhan + waste ({wasteNum}%)</span>
                  <span className="font-medium">{qtyActual.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Harga (avg FIFO)</span>
                  <span className="font-medium">{formatRupiah(avgPrice)}/kg</span>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={!fabricId || qtyRequiredNum <= 0}>Tambah Bahan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}