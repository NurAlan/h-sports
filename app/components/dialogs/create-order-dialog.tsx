"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/toast/toast-provider";
import { api } from "@/lib/api";

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
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [quantity, setQuantity] = useState("");
  const [specification, setSpecification] = useState("");
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [deadline, setDeadline] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newOrder = await api.post<{ orderNumber: string }>("/api/orders", {
        customerName,
        customerContact,
        qtyItems: parseInt(quantity),
        specification,
        orderDate,
        deadline,
      });

      setCustomerName("");
      setCustomerContact("");
      setQuantity("");
      setSpecification("");
      setOrderDate(new Date().toISOString().split("T")[0]);
      setDeadline("");

      onOpenChange(false);
      onOrderCreated?.(newOrder.orderNumber);
      toast.success(`Order ${newOrder.orderNumber} berhasil dibuat`);
      window.location.reload();
    } catch (err) {
      toast.error(`Gagal: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
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
          <DialogBody>
          <div className="grid gap-4">
            {/* Customer Name */}
            <div className="grid gap-2">
              <Label htmlFor="customerName">Nama Customer *</Label>
              <Input
                id="customerName"
                placeholder="Contoh: Toko Baju Sejahtera"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            {/* Customer Contact */}
            <div className="grid gap-2">
              <Label htmlFor="customerContact">No. HP / Kontak</Label>
              <Input
                id="customerContact"
                placeholder="Contoh: 08123456789"
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
              />
            </div>

            {/* Quantity */}
            <div className="grid gap-2">
              <Label htmlFor="quantity">Jumlah (pcs) *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="Contoh: 100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            {/* Specification */}
            <div className="grid gap-2">
              <Label htmlFor="specification">Spesifikasi</Label>
              <Textarea
                id="specification"
                placeholder="Contoh: Kaos polos putih ukuran M-XL, sablon depan"
                value={specification}
                onChange={(e) => setSpecification(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Order Date */}
              <div className="grid gap-2">
                <Label htmlFor="orderDate">Tanggal Order</Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  required
                />
              </div>

              {/* Deadline */}
              <div className="grid gap-2">
                <Label htmlFor="deadline">
                  Deadline{" "}
                  <span className="text-red-500">*</span>
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
            <Button
              type="submit"
              disabled={!customerName || !quantity || !deadline || loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Menyimpan...
                </span>
              ) : "Buat Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
