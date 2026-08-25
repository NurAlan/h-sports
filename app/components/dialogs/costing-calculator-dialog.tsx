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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getBOMForOrder } from "@/lib/mock-data";
import { formatRupiah } from "@/lib/utils";
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
  const toast = useToast();

  // Material cost dari BOM (live)
  const materialCost = useMemo(
    () => getBOMForOrder(orderId).reduce((s, i) => s + i.materialCost, 0),
    [orderId, open]
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API call
    console.log({
      orderId,
      materialCost,
      laborCost: laborNum,
      hpp,
      pricingMethod,
      markupPct: markupNum,
      fixedProfit: fixedProfitNum,
      sellingPrice,
      shippingCost: shippingNum,
      profit,
      profitMargin,
    });
    onOpenChange(false);
    toast.success("Costing berhasil disimpan");
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
          <div className="grid gap-4 py-4">
            {/* Material cost (readonly) */}
            <div className="grid gap-2">
              <Label>Material Cost (dari BOM)</Label>
              <div className="rounded-lg bg-gray-100 border border-gray-200 px-3 py-2 text-sm font-semibold">
                {formatRupiah(materialCost)}
              </div>
            </div>

            {/* Labor cost */}
            <div className="grid gap-2">
              <Label htmlFor="labor">Upah Jahit (Rp)</Label>
              <Input
                id="labor"
                type="number"
                step="10000"
                min="0"
                value={laborCost}
                onChange={(e) => setLaborCost(e.target.value)}
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
                <Input
                  id="fixed"
                  type="number"
                  step="10000"
                  min="0"
                  placeholder="100000"
                  value={fixedProfit}
                  onChange={(e) => setFixedProfit(e.target.value)}
                />
              </div>
            )}

            {/* Shipping */}
            <div className="grid gap-2">
              <Label htmlFor="shipping">Ongkos Kirim (Rp)</Label>
              <Input
                id="shipping"
                type="number"
                step="5000"
                min="0"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
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
                <span className="font-semibold text-green-600">Profit</span>
                <span className="font-bold text-green-600">{formatRupiah(profit)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Margin</span>
                <span className="font-medium text-green-600">{profitMargin.toFixed(1)}%</span>
              </div>
              {profit < 0 && (
                <p className="text-xs text-red-600 font-medium">⚠️ Rugi! Naikkan markup atau profit tetap.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit">Simpan Costing</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}