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
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/toast/toast-provider";
import { api, type Order } from "@/lib/api";

interface EditCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  initialCustomerName: string;
  initialCustomerContact?: string | null;
  onSuccess?: (updated: { customerName: string; customerContact?: string | null }) => void;
}

export function EditCustomerDialog({
  open,
  onOpenChange,
  orderId,
  initialCustomerName,
  initialCustomerContact,
  onSuccess,
}: EditCustomerDialogProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState(initialCustomerName || "");
  const [customerContact, setCustomerContact] = useState(initialCustomerContact || "");

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomerName(initialCustomerName || "");
      setCustomerContact(initialCustomerContact || "");
    }
  }, [open, initialCustomerName, initialCustomerContact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customerName.trim();
    if (!trimmed) {
      toast.error("Nama customer tidak boleh kosong");
      return;
    }

    setLoading(true);
    try {
      const updated = await api.patch<Order>(`/api/orders/${orderId}`, {
        customerName: trimmed,
        customerContact: customerContact.trim() || null,
      });
      toast.success("Nama customer berhasil diperbarui");
      onSuccess?.({
        customerName: updated.customerName,
        customerContact: updated.customerContact,
      });
      onOpenChange(false);
    } catch (err) {
      toast.error(`Gagal update nama: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>
            Perbaiki nama atau nomor kontak customer jika ada kesalahan ketik
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <DialogBody>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-customer-name">Nama Customer *</Label>
                <Input
                  id="edit-customer-name"
                  placeholder="Contoh: PT Harapan Jaya"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-customer-contact">No. Kontak / WhatsApp (Opsional)</Label>
                <Input
                  id="edit-customer-contact"
                  placeholder="Contoh: 08123456789"
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
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
            <Button type="submit" disabled={loading || !customerName.trim()}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
