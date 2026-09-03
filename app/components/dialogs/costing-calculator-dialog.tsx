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
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatRupiah, profitColor } from "@/lib/utils";
import { useToast } from "@/components/toast/toast-provider";

interface CostingCalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
}

interface OtherCostRow {
  id: string; // local key
  label: string;
  amount: string;
  keterangan: string;
}

function newRow(): OtherCostRow {
  return { id: Math.random().toString(36).slice(2), label: "", amount: "", keterangan: "" };
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
  const [otherCosts, setOtherCosts] = useState<OtherCostRow[]>([]);
  const [bomItems, setBomItems] = useState<{ materialCost: number }[]>([]);
  const [bomLoading, setBomLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Fetch BOM + existing costing saat dialog dibuka
  useEffect(() => {
    if (!open || !orderId) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBomLoading(true);

    Promise.all([
      api.get<{ materialCost: number }[]>(`/api/orders/${orderId}/bom`),
      api.get<{
        laborCost?: number;
        shippingCost?: number;
        pricingMethod?: string;
        markupPct?: number | null;
        fixedProfit?: number;
        otherCosts?: { label: string; amount: number; keterangan: string | null }[];
      }>(`/api/orders/${orderId}/costing`),
    ])
      .then(([bom, costing]) => {
        setBomItems(bom);
        if (costing && costing.laborCost != null) {
          setLaborCost(String(costing.laborCost));
          setShippingCost(String(costing.shippingCost ?? 50000));
          setPricingMethod((costing.pricingMethod as "markup" | "fixed_profit") ?? "markup");
          setMarkupPct(String(costing.markupPct ?? 30));
          setFixedProfit(String(costing.fixedProfit ?? ""));
          setOtherCosts(
            (costing.otherCosts ?? []).map((c) => ({
              id: Math.random().toString(36).slice(2),
              label: c.label,
              amount: String(c.amount),
              keterangan: c.keterangan ?? "",
            }))
          );
        }
      })
      .catch(() => setBomItems([]))
      .finally(() => setBomLoading(false));
  }, [open, orderId]);

  // Reset form ketika dialog ditutup
  useEffect(() => {
    if (!open) {
      setLaborCost("500000");
      setShippingCost("50000");
      setPricingMethod("markup");
      setMarkupPct("30");
      setFixedProfit("");
      setOtherCosts([]);
      setBomItems([]);
    }
  }, [open]);

  // Material cost dari BOM (live dari API)
  const materialCost = useMemo(
    () => bomItems.reduce((s, i) => s + i.materialCost, 0),
    [bomItems]
  );

  const laborNum = parseFloat(laborCost) || 0;
  const shippingNum = parseFloat(shippingCost) || 0;
  const markupNum = parseFloat(markupPct) || 0;
  const fixedProfitNum = parseFloat(fixedProfit) || 0;

  const otherCostTotal = useMemo(
    () => otherCosts.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0),
    [otherCosts]
  );

  // HPP = material + upah + biaya lain (ADR-0003); ongkir di luar HPP
  const hpp = materialCost + laborNum + otherCostTotal;

  const sellingPrice =
    pricingMethod === "markup"
      ? hpp * (1 + markupNum / 100) + shippingNum
      : hpp + fixedProfitNum + shippingNum;

  const profit = sellingPrice - hpp - shippingNum;
  const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

  // ── Biaya lain helpers ────────────────────────────────────────────
  const addRow = () => setOtherCosts((prev) => [...prev, newRow()]);
  const removeRow = (id: string) => setOtherCosts((prev) => prev.filter((r) => r.id !== id));
  const updateRow = (id: string, field: keyof Omit<OtherCostRow, "id">, value: string) =>
    setOtherCosts((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

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
        otherCosts: otherCosts
          .filter((c) => c.label.trim() && parseFloat(c.amount) > 0)
          .map((c) => ({
            label: c.label.trim(),
            amount: parseFloat(c.amount),
            keterangan: c.keterangan.trim() || null,
          })),
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
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Costing & Harga Jual</DialogTitle>
          <DialogDescription>
            {orderNumber} — Hitung HPP dan tentukan harga jual
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <DialogBody>
          <div className="grid gap-4">
            {/* Material cost (readonly) */}
            <div className="grid gap-2">
              <Label>Material Cost (dari BOM)</Label>
              <div className="rounded-lg bg-stone-100 border border-stone-200 px-3 py-2 text-base font-semibold">
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

            {/* ── Biaya Lain-lain ────────────────────────────────── */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Biaya Lain-lain</Label>
                <button
                  type="button"
                  onClick={addRow}
                  className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-white px-3 py-1.5 min-h-[36px] text-sm font-semibold text-primary hover:bg-blue-50 active:scale-95 transition-all shadow-xs"
                >
                  <Plus className="h-4 w-4" /> Tambah
                </button>
              </div>

              {otherCosts.length === 0 && (
                <p className="text-sm text-muted-foreground py-1">
                  Belum ada biaya tambahan — klik Tambah untuk menambah sablon, resleting, aksesoris, dll.
                </p>
              )}

              {otherCosts.map((row) => (
                <div key={row.id} className="rounded-lg border border-stone-200 bg-stone-50/90 p-3 grid gap-2.5 shadow-xs">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 min-w-0">
                      <label className="text-[11px] font-medium text-muted-foreground block mb-1">Nama biaya *</label>
                      <Input
                        placeholder="cth. Sablon, Resleting"
                        value={row.label}
                        onChange={(e) => updateRow(row.id, "label", e.target.value)}
                        className="h-10 text-base"
                      />
                    </div>
                    <div className="w-32 sm:w-36 shrink-0">
                      <label className="text-[11px] font-medium text-muted-foreground block mb-1">Total (Rp) *</label>
                      <CurrencyInput
                        placeholder="50.000"
                        value={row.amount}
                        onChange={(v) => updateRow(row.id, "amount", v)}
                        className="h-10 text-base"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="h-10 w-10 min-w-[40px] flex items-center justify-center rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:text-red-700 active:scale-90 transition-all shrink-0"
                      title="Hapus baris biaya"
                      aria-label="Hapus baris biaya"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">Keterangan (opsional)</label>
                    <Input
                      placeholder="cth. 50 pcs × Rp 2.000"
                      value={row.keterangan}
                      onChange={(e) => updateRow(row.id, "keterangan", e.target.value)}
                      className="h-10 text-base"
                    />
                  </div>
                </div>
              ))}

              {otherCosts.length > 0 && (
                <div className="flex justify-between text-sm px-1">
                  <span className="text-muted-foreground">Total Biaya Lain</span>
                  <span className="font-semibold">{formatRupiah(otherCostTotal)}</span>
                </div>
              )}
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
              <p className="text-xs text-muted-foreground">
                Ongkir tidak masuk HPP, tapi mengurangi profit final
              </p>
            </div>

            {/* Hasil kalkulasi live */}
            <div className="rounded-lg bg-stone-50 border border-stone-200 p-3 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Material Cost</span>
                <span>{formatRupiah(materialCost)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Upah Jahit</span>
                <span>{formatRupiah(laborNum)}</span>
              </div>
              {otherCostTotal > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Biaya Lain-lain</span>
                  <span>{formatRupiah(otherCostTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold border-t border-stone-200 pt-1.5">
                <span>HPP</span>
                <span>{formatRupiah(hpp)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Ongkos Kirim</span>
                <span>{formatRupiah(shippingNum)}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">Harga Jual</span>
                <span className="font-bold text-primary text-lg">{formatRupiah(sellingPrice)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base">
                <span className={profitColor(profit)}>Profit</span>
                <span className={`font-bold ${profitColor(profit)}`}>{formatRupiah(profit)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Margin</span>
                <span className={`font-medium ${profitColor(profit)}`}>{profitMargin.toFixed(1)}%</span>
              </div>
              {profit < 0 && (
                <p className="text-sm text-red-600 font-medium">⚠️ Rugi! Naikkan markup atau profit tetap.</p>
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
