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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/toast/toast-provider";

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated?: (orderId: string) => void;
}

export function CreateOrderDialog({
  open,
  onOpenChange,
  onOrderCreated,
}: CreateOrderDialogProps) {
  const toast = useToast();
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [quantity, setQuantity] = useState("");
  const [specification, setSpecification] = useState("");
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [deadline, setDeadline] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const orderNumber = `ORD-${new Date()
      .toISOString()
      .split("T")[0]
      .replace(/-/g, "")}-${String(
      Math.floor(Math.random() * 900) + 100
    ).padStart(3, "0")}`;

    // TODO: API call to create order
    console.log({
      orderNumber,
      customerName,
      customerContact,
      quantity: parseInt(quantity),
      specification,
      orderDate,
      deadline,
      status: "draft",
    });

    // Reset form
    setCustomerName("");
    setCustomerContact("");
    setQuantity("");
    setSpecification("");
    setOrderDate(new Date().toISOString().split("T")[0]);
    setDeadline("");

    onOpenChange(false);
    onOrderCreated?.(orderNumber);
    toast.success(`Order ${orderNumber} berhasil dibuat`);
  };

  // Minimum deadline = tanggal order (tidak boleh sebelum order date)
  const minDeadline = orderDate || new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Order Baru</DialogTitle>
          <DialogDescription>
            Input data pesanan kaos dari customer
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Customer Name */}
            <div className="grid gap-2">
              <Label htmlFor="customer">Nama Customer *</Label>
              <Input
                id="customer"
                placeholder="Contoh: Toko Baju Sejahtera"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            {/* Customer Contact */}
            <div className="grid gap-2">
              <Label htmlFor="contact">Kontak (Telp/Email)</Label>
              <Input
                id="contact"
                placeholder="08123456789 atau email@domain.com"
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
              />
            </div>

            {/* Quantity */}
            <div className="grid gap-2">
              <Label htmlFor="qty">Jumlah Kaos (pcs) *</Label>
              <Input
                id="qty"
                type="number"
                min="1"
                placeholder="50"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            {/* Specification */}
            <div className="grid gap-2">
              <Label htmlFor="spec">Spesifikasi</Label>
              <Textarea
                id="spec"
                placeholder={"Ukuran: M, L, XL\nWarna: Navy Blue\nDesain: Logo depan"}
                value={specification}
                onChange={(e) => setSpecification(e.target.value)}
                rows={3}
              />
            </div>

            {/* Tanggal Order + Deadline berdampingan */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="date">Tanggal Order *</Label>
                <Input
                  id="date"
                  type="date"
                  value={orderDate}
                  onChange={(e) => {
                    setOrderDate(e.target.value);
                    // Reset deadline jika sebelum order date baru
                    if (deadline && deadline < e.target.value) {
                      setDeadline("");
                    }
                  }}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deadline">
                  Deadline *{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    (selesai)
                  </span>
                </Label>
                <Input
                  id="deadline"
                  type="date"
                  min={minDeadline}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>
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
            <Button
              type="submit"
              disabled={!customerName || !quantity || !deadline}
            >
              Buat Order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
