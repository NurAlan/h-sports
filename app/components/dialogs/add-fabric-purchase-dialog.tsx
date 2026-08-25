"use client";

import { useState } from "react";
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
import { FABRIC_CATALOG } from "@/lib/master-data";

interface AddFabricPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddFabricPurchaseDialog({
  open,
  onOpenChange,
}: AddFabricPurchaseDialogProps) {
  const [fabricId, setFabricId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [quantity, setQuantity] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: API call to create fabric purchase
    console.log({
      fabricId,
      supplierName,
      purchaseDate,
      quantity: parseFloat(quantity),
      pricePerKg: parseFloat(pricePerKg),
    });

    // Reset form
    setFabricId("");
    setSupplierName("");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setQuantity("");
    setPricePerKg("");
    
    onOpenChange(false);
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
          <div className="grid gap-4 py-4">
            {/* Fabric Selection */}
            <div className="grid gap-2">
              <Label htmlFor="fabric">Jenis Kain *</Label>
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
              <Label htmlFor="quantity">Jumlah (kg) *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="0.0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            {/* Price per kg */}
            <div className="grid gap-2">
              <Label htmlFor="price">Harga per kg (Rp) *</Label>
              <Input
                id="price"
                type="number"
                step="100"
                min="0"
                placeholder="50000"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={!fabricId || !quantity || !pricePerKg}>
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
