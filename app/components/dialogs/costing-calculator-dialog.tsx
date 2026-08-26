"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { formatRupiah, profitColor } from "@/lib/utils";
import { useToast } from "@/components/toast/toast-provider";

interface CostingCalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
}

export function CostingCalculatorDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
}: CostingCalculatorDialogProps) {
  const [laborCost, setLaborCost] = useState("500000");
  const [shippingCost, setShippingCost] = useState("50000");
  const [pricingMethod, setPricingMethod] = useState<"markup" | "fixed_profit">("markup");
  const [markupPct, setMarkupPct] = useState("30");
  const [fixedProfit, setFixedProfit] = useState("");
  const [bomItems, setBomItems] = useState<{ materialCost: number }[]>([]);
  const [bomLoading, setBomLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Fetch BOM dari API saat dialog dibuka — material cost sesuai DB
  useEffect(() => {
    if (open && orderId) {
      setBomLoading(true);
      api
        .get<{ materialCost: number }[]>(`/api/orders/${orderId}/bom`)
        .then((items) => setBomItems(items))
        .catch(() => setBomItems([]))
        .finally(() => setBomLoading(false));
    }
  }, [open, orderId]);

  // Material cost dari BOM (live dari API)
  const materialCost = useMemo(
    () => bomItems.reduce((s, i) => s + i.materialCost, 0),
    [bomItems]
  );

  const laborNum = parseFloat(laborCost) || 0;
  const shippingNum = parseFloat(shippingCost) || 0;
  const markupNum = parseFloat(markupPct) || 0;
  const fixedProfitNum = parseFloat(fixedProfit) || 0;

  const hpp = materialCost + laborNum;

  const sellingPrice =
    pricingMethod === "markup"
      ? hpp * (1 + markupNum / 100)
      : hpp + fixedProfitNum;

  const profit = sellingPrice - hpp - shippingNum;
  const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/api/orders/${orderId}/costing`, {
        laborCost,
        pricingMethod,
        markupPct,
        fixedProfit,
        shippingCost,
      });
      onOpenChange(false);
      toast.success("Costing berhasil disimpan");
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
          <DialogTitle>Costing & Harga Jual</DialogTitle>
          <DialogDescription>
            {orderNumber} — Hitung HPP dan tentukan harga jual
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody>
          <div className="grid gap-4">
            {/* Material cost (readonly) */}
            <div className="grid gap-2">
              <Label>Material Cost (dari BOM)</Label>
              <div className="rounded-lg bg-gray-100 border border-gray-200 px-3 py-2 text-sm font-semibold">
                {bomLoading ? (
                  <span className="text-muted-foreground animate-pulse">Memuat...</span>
                ) : (
                  formatRupiah(materialCost)
                )}
              </div>
            </div>

            {/* Labor cost */}
            <div className="grid gap-2">
              <Label htmlFor="labor">Upah Jahit (Rp)</Label>
              <CurrencyInput
                id="labor"
                placeholder="500.000"
                value={laborCost}
                onChange={setLaborCost}
              />
            </div>

            {/* Pricing method */}
            <div className="grid gap-2">
              <Label>Metode Harga Jual</Label>
              <Select
                value={pricingMethod}
                onValueChange={(val) => setPricingMethod((val as "markup" | "fixed_profit") || "markup")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="markup">Markup Persentase (%)</SelectItem>
                  <SelectItem value="fixed_profit">Profit Tetap (Rp)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {pricingMethod === "markup" ? (
              <div className="grid gap-2">
                <Label htmlFor="markup">Markup (%)</Label>
                <Input
                  id="markup"
                  type="number"
                  step="1"
                  min="0"
                  value={markupPct}
                  onChange={(e) => setMarkupPct(e.target.value)}
                />
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="fixed">Profit Tetap (Rp)</Label>
                <CurrencyInput
                  id="fixed"
                  placeholder="100.000"
                  value={fixedProfit}
                  onChange={setFixedProfit}
                />
              </div>
            )}

            {/* Shipping */}
            <div className="grid gap-2">
              <Label htmlFor="shipping">Ongkos Kirim (Rp)</Label>
              <CurrencyInput
                id="shipping"
                placeholder="50.000"
                value={shippingCost}
                onChange={setShippingCost}
              />
            </div>

            {/* Hasil kalkulasi live */}
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">HPP (Material + Upah)</span>
                <span className="font-semibold">{formatRupiah(hpp)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Harga Jual</span>
                <span className="font-bold text-primary text-base">{formatRupiah(sellingPrice)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className={profitColor(profit)}>Profit</span>
                <span className={`font-bold ${profitColor(profit)}`}>{formatRupiah(profit)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Margin</span>
                <span className={`font-medium ${profitColor(profit)}`}>{profitMargin.toFixed(1)}%</span>
              </div>
              {profit < 0 && (
                <p className="text-xs text-red-600 font-medium">⚠️ Rugi! Naikkan markup atau profit tetap.</p>
              )}
            </div>
          </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Batal</Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Menyimpan...
                </span>
              ) : "Simpan Costing"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
