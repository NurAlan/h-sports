"use client";

import { useState, useEffect } from "react";
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
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FABRIC_CATALOG } from "@/lib/master-data";
import { api } from "@/lib/api";
import { useToast } from "@/components/toast/toast-provider";

interface AddFabricPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Prefill jenis kain (dipakai dari detail inventory) */
  initialFabricId?: string;
  /** Prefill harga per kg (auto dari data inventory) */
  initialPricePerKg?: number;
  /** Prefill supplier (auto dari batch terakhir) */
  initialSupplierName?: string;
}

export function AddFabricPurchaseDialog({
  open,
  onOpenChange,
  initialFabricId,
  initialPricePerKg,
  initialSupplierName,
}: AddFabricPurchaseDialogProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [fabricId, setFabricId] = useState(initialFabricId ?? "");
  const [supplierName, setSupplierName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [quantity, setQuantity] = useState("");
  const [pricePerKg, setPricePerKg] = useState(
    initialPricePerKg ? String(initialPricePerKg) : ""
  );

  // Auto-fill saat dialog dibuka — field terisi dari data inventory
  useEffect(() => {
    if (open) {
      if (initialFabricId) setFabricId(initialFabricId);
      if (initialPricePerKg) setPricePerKg(String(initialPricePerKg));
      if (initialSupplierName) setSupplierName(initialSupplierName);
      setPurchaseDate(new Date().toISOString().split("T")[0]);
    }
  }, [open, initialFabricId, initialPricePerKg, initialSupplierName]);

  const selectedFabric = FABRIC_CATALOG.find((f) => f.id === fabricId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/fabric-batches", {
        fabricId,
        supplierName,
        purchaseDate,
        qtyPurchased: parseFloat(quantity),
        pricePerKg: parseFloat(pricePerKg),
      });

      // Reset form
      setQuantity("");
      if (!initialFabricId) setFabricId("");
      if (!initialSupplierName) setSupplierName("");

      onOpenChange(false);
      toast.success(`Pembelian ${selectedFabric?.name ?? "kain"} berhasil ditambahkan`);
      window.location.reload();
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
          <DialogTitle>Tambah Pembelian Kain</DialogTitle>
          <DialogDescription>
            Input data pembelian kain baru untuk menambah stok
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody>
          <div className="grid gap-4">
            {/* Fabric Selection — lock jika prefill dari detail inventory */}
            <div className="grid gap-2">
              <Label htmlFor="fabric">Jenis Kain *</Label>
              {initialFabricId && selectedFabric ? (
                <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-gray-50 px-3 py-2">
                  <span className="text-sm font-medium text-foreground">
                    {selectedFabric.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Auto dari inventory
                  </span>
                </div>
              ) : (
                <Select value={fabricId} onValueChange={(val) => setFabricId(val || "")} required>
                  <SelectTrigger id="fabric">
                    <SelectValue placeholder="Pilih kain" />
                  </SelectTrigger>
                  <SelectContent>
                    {FABRIC_CATALOG.map((fabric) => (
                      <SelectItem key={fabric.id} value={fabric.id}>
                        {fabric.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Supplier Name */}
            <div className="grid gap-2">
              <Label htmlFor="supplier">Nama Supplier</Label>
              <Input
                id="supplier"
                placeholder="Contoh: Supplier A"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
              />
            </div>

            {/* Purchase Date */}
            <div className="grid gap-2">
              <Label htmlFor="date">Tanggal Beli *</Label>
              <Input
                id="date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
            </div>

            {/* Quantity */}
            <div className="grid gap-2">
              <Label htmlFor="qty">Jumlah (kg) *</Label>
              <Input
                id="qty"
                type="number"
                step="0.1"
                min="0"
                placeholder="Contoh: 20"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            {/* Price per kg */}
            <div className="grid gap-2">
              <Label htmlFor="price">Harga per kg (Rp) *</Label>
              <CurrencyInput
                id="price"
                placeholder="50.000"
                value={pricePerKg}
                onChange={setPricePerKg}
                required
              />
            </div>
          </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={!fabricId || !quantity || !pricePerKg || loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Menyimpan...
                </span>
              ) : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
