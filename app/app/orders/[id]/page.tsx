"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { api, type Order } from "@/lib/api";
import { DetailSkeleton } from "@/components/skeletons";
import { useToast } from "@/components/toast/toast-provider";
import { formatRupiah, formatDate, daysUntil, daysLeftLabel, profitColor } from "@/lib/utils";
import {
  ArrowLeft,
  Package,
  Layers,
  Clock,
  DollarSign,
  Plus,
  CheckCircle2,
  Circle,
  TrendingUp,
  Wrench,
  Truck,
  Pencil,
  Trash2,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddBOMItemDialog } from "@/components/dialogs/add-bom-item-dialog";
import { UpdateTimelineDialog } from "@/components/dialogs/update-timeline-dialog";
import { CostingCalculatorDialog } from "@/components/dialogs/costing-calculator-dialog";

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-700" },
  in_production: { label: "Produksi", className: "bg-blue-100 text-blue-700" },
  qc: { label: "QC", className: "bg-amber-100 text-amber-700" },
  shipped: { label: "Terkirim", className: "bg-green-100 text-green-700" },
};

// Workflow status: draft → in_production → qc → shipped
const STATUS_FLOW = ["draft", "in_production", "qc", "shipped"] as const;
const NEXT_ACTION: Record<string, { label: string; next: string }> = {
  draft: { label: "Mulai Produksi", next: "in_production" },
  in_production: { label: "Masuk QC", next: "qc" },
  qc: { label: "Tandai Selesai", next: "shipped" },
};

function getStageIcon(status: string) {
  switch (status) {
    case "completed": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "in_progress": return <Clock className="h-4 w-4 text-blue-600" />;
    default: return <Circle className="h-4 w-4 text-gray-300" />;
  }
}

function getStageBadge(status: string) {
  const variants: Record<string, { label: string; className: string }> = {
    completed: { label: "Selesai", className: "bg-green-100 text-green-700" },
    in_progress: { label: "Sedang Dikerjakan", className: "bg-blue-100 text-blue-700" },
    not_started: { label: "Belum Dimulai", className: "bg-gray-100 text-gray-600" },
  };
  const config = variants[status] || { label: status, className: "" };
  return <Badge variant="secondary" className={`text-xs ${config.className}`}>{config.label}</Badge>;
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order & {
    bomItems?: Array<{
      id: string;
      fabricId: string;
      fabricName: string;
      qtyRequired: number;
      wastePct: number;
      qtyActual: number;
      pricePerKg: number;
      materialCost: number;
    }>;
    timelines?: Array<{
      id: string;
      stageName: string;
      status: string;
      estimatedHrs: number | null;
    }>;
    costing?: {
      materialCost: number;
      laborCost: number;
      hpp: number;
      pricingMethod: string;
      markupPct: number | null;
      fixedProfit: number;
      sellingPrice: number;
      shippingCost: number;
      profit: number;
      profitMargin: number;
    } | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [stockLoading, setStockLoading] = useState(false);

  /** Lazy load stok — hanya fetch saat dibutuhkan */
  const loadStockIfNeeded = async () => {
    if (Object.keys(stockMap).length > 0) return;
    setStockLoading(true);
    try {
      const invData = await api.get<{ id: string; stock: number }[]>("/api/inventory");
      const map: Record<string, number> = {};
      for (const it of invData) map[it.id] = it.stock;
      setStockMap(map);
    } catch { /* gagal fetch stok — shortages kosong */ }
    finally { setStockLoading(false); }
  };

  const [bomOpen, setBomOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [costingOpen, setCostingOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const toast = useToast();
  type BomItemType = {
    id: string;
    fabricId: string;
    fabricName: string;
    qtyRequired: number;
    wastePct: number;
    qtyActual: number;
    pricePerKg: number;
    materialCost: number;
  };
  const [editBomItem, setEditBomItem] = useState<BomItemType | null>(null);
  const [deleteBomItem, setDeleteBomItem] = useState<BomItemType | null>(null);
  const [editBomForm, setEditBomForm] = useState({ qtyRequired: "", wastePct: "" });
  const [editBomLoading, setEditBomLoading] = useState(false);
  const [deleteBomLoading, setDeleteBomLoading] = useState(false);

  useEffect(() => {
    api.get<typeof order>(`/api/orders/${params.id}`)
      .then((orderData) => {
        setOrder(orderData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  // Data BOM (null-safe saat loading) — hook HARUS sebelum early return
  const bom = order?.bomItems ?? [];

  // Cek stok cukup untuk semua BOM (validasi SEBELUM mulai produksi)
  const shortages = useMemo(() => {
    const list: { fabricName: string; needed: number; available: number }[] = [];
    for (const item of bom) {
      const available = stockMap[item.fabricId] ?? 0;
      if (available < item.qtyActual) {
        list.push({
          fabricName: item.fabricName,
          needed: Math.round(item.qtyActual * 10) / 10,
          available: Math.round(available * 10) / 10,
        });
      }
    }
    return list;
  }, [bom, stockMap]);

  if (loading) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6 text-center">
        <p className="text-muted-foreground">Order tidak ditemukan</p>
        <Link href="/orders" className="text-primary text-sm hover:underline">← Kembali ke Orders</Link>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.draft;
  const timeline = order.timelines ?? [];
  const costing = order.costing ?? null;
  const isDraft = order.status === "draft";
  const currentIndex = STATUS_FLOW.indexOf(order.status as (typeof STATUS_FLOW)[number]);
  const nextAction = NEXT_ACTION[order.status];

  // Validasi kondisi sebelum advance status
  const productionStages = timeline.filter((s) => s.stageName !== "qc");
  const qcStage = timeline.find((s) => s.stageName === "qc");

  /** Semua stage produksi (non-QC) selesai? */
  const allProductionDone =
    productionStages.length > 0 &&
    productionStages.every((s) => s.status === "completed");

  /** Stage QC selesai? */
  const qcDone = qcStage?.status === "completed";

  /**
   * Apakah tombol advance status boleh diklik?
   * - Masuk QC (in_production → qc): semua stage produksi harus selesai
   * - Tandai Selesai (qc → shipped): stage QC harus selesai
   * - Mulai Produksi (draft → in_production): bebas
   */
  const canAdvance = (() => {
    if (!nextAction) return false;
    if (nextAction.next === "qc") {
      return allProductionDone;
    }
    if (nextAction.next === "shipped") {
      return qcDone;
    }
    return true; // draft → in_production
  })();

  const advanceBlockReason = (() => {
    if (!nextAction || canAdvance) return null;
    if (nextAction.next === "qc") {
      const pending = productionStages.filter((s) => s.status !== "completed");
      if (productionStages.length === 0) return "Belum ada timeline produksi — isi dulu via tombol Update";
      return `${pending.length} stage belum selesai: ${pending.map((s) => s.stageName).join(", ")}`;
    }
    if (nextAction.next === "shipped") {
      return "Stage QC belum selesai — tandai QC completed di timeline";
    }
    return null;
  })();

  /** Lanjutkan status: draft → in_production → qc → shipped */
  const handleAdvanceStatus = async () => {
    if (!nextAction) return;
    setStatusUpdating(true);
    try {
      const updated = await api.patch<Order>(`/api/orders/${order.id}`, {
        status: nextAction.next,
      });
      toast.success(
        nextAction.next === "in_production"
          ? `Order ${order.orderNumber} masuk produksi — stok dipotong (FIFO)`
          : `Order ${order.orderNumber} → ${statusConfig[nextAction.next]?.label ?? nextAction.next}`
      );
      setOrder((prev) => (prev ? { ...prev, status: updated.status } : prev));
    } catch (err) {
      toast.error(`Gagal update status: ${(err as Error).message}`);
    } finally {
      setStatusUpdating(false);
    }
  };

  /** Buka dialog edit BOM — prefill dari item */
  const openEditBom = (item: BomItemType) => {
    setEditBomItem(item);
    setEditBomForm({
      qtyRequired: String(item.qtyRequired),
      wastePct: String(item.wastePct),
    });
  };

  /** Simpan perubahan BOM */
  const handleUpdateBom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBomItem) return;
    setEditBomLoading(true);
    try {
      const updated = await api.patch<BomItemType>(
        `/api/orders/${order.id}/bom/${editBomItem.id}`,
        {
          qtyRequired: parseFloat(editBomForm.qtyRequired),
          wastePercentage: parseFloat(editBomForm.wastePct),
        }
      );
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              bomItems: (prev.bomItems ?? []).map((it) =>
                it.id === editBomItem.id ? { ...it, ...updated } : it
              ),
            }
          : prev
      );
      toast.success(`Bahan ${editBomItem.fabricName} diperbarui`);
      setEditBomItem(null);
    } catch (err) {
      toast.error(`Gagal update: ${(err as Error).message}`);
    } finally {
      setEditBomLoading(false);
    }
  };

  /** Hapus BOM item */
  const handleDeleteBom = async () => {
    if (!deleteBomItem) return;
    setDeleteBomLoading(true);
    try {
      await api.del(`/api/orders/${order.id}/bom/${deleteBomItem.id}`);
      setOrder((prev) =>
        prev
          ? { ...prev, bomItems: (prev.bomItems ?? []).filter((it) => it.id !== deleteBomItem.id) }
          : prev
      );
      toast.success(`Bahan ${deleteBomItem.fabricName} dihapus`);
      setDeleteBomItem(null);
    } catch (err) {
      toast.error(`Gagal hapus: ${(err as Error).message}`);
    } finally {
      setDeleteBomLoading(false);
    }
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      {/* Back */}
      <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mb-4">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Orders
      </Link>

      {/* Header Order */}
      <Card className="mb-4 card-shadow-lg bg-gray-100 border-2 border-gray-300 hover:shadow-xl hover:-translate-y-0.5 transition-all">
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-lg font-bold text-foreground">{order.orderNumber}</p>
            <Badge variant="secondary" className={status.className}>{status.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{order.customerName}</p>
          {order.customerContact && (
            <p className="text-xs text-muted-foreground mb-1">{order.customerContact}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {order.qtyItems} pcs</span>
            <span>Order: {formatDate(order.orderDate)}</span>
          </div>

          {/* Workflow status — Draft → Produksi → QC → Selesai */}
          <div className="mt-4">
            <div className="flex items-center gap-1 mb-3">
              {STATUS_FLOW.map((s, i) => {
                const config = statusConfig[s];
                const isDone = i < currentIndex || order.status === "shipped";
                const isCurrent = i === currentIndex;
                return (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold border-2 ${
                          isDone
                            ? "bg-green-500 border-green-500 text-white"
                            : isCurrent
                              ? "bg-primary border-primary text-white"
                              : "bg-white border-gray-300 text-gray-400"
                        }`}
                      >
                        {isDone ? "✓" : i + 1}
                      </div>
                      <span
                        className={`text-[9px] font-medium whitespace-nowrap ${
                          isCurrent ? "text-primary" : isDone ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        {config.label}
                      </span>
                    </div>
                    {i < STATUS_FLOW.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-1 mb-4 rounded ${
                          i < currentIndex ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Peringatan stok tidak cukup — hanya untuk Draft */}
            {isDraft && shortages.length > 0 && (
              <div className="mb-2 rounded-lg bg-red-50 border border-red-300 px-3 py-2.5">
                <p className="text-xs font-semibold text-red-700 mb-1">
                  ⚠️ Stok tidak cukup untuk memulai produksi:
                </p>
                {shortages.map((s) => (
                  <p key={s.fabricName} className="text-[11px] text-red-600 leading-relaxed">
                    • {s.fabricName}: butuh <b>{s.needed} kg</b>, tersedia {s.available} kg
                  </p>
                ))}
                <p className="text-[11px] text-red-600 mt-1">
                  ➡️ Tambah stok di Inventory, lalu coba lagi.
                </p>
              </div>
            )}

            {nextAction && (
              <>
                {/* Pesan blokir jika kondisi belum terpenuhi */}
                {!canAdvance && advanceBlockReason && (
                  <div className="mb-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                    <p className="text-[11px] text-amber-700 font-medium">
                      🔒 {advanceBlockReason}
                    </p>
                  </div>
                )}
              <Button
                onClick={handleAdvanceStatus}
                onMouseEnter={loadStockIfNeeded}
                onTouchStart={loadStockIfNeeded}
                disabled={statusUpdating || !canAdvance || stockLoading}
                className={`w-full gap-1.5 ${!canAdvance ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {statusUpdating ? (
                  "Memproses..."
                ) : nextAction.next === "in_production" ? (
                  <>
                    <Wrench className="h-4 w-4" /> {nextAction.label}
                  </>
                ) : nextAction.next === "qc" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> {nextAction.label}
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4" /> {nextAction.label}
                  </>
                )}
              </Button>
              </>
            )}
            {order.status === "shipped" && (
              <p className="text-center text-xs font-medium text-green-600 mt-1">
                ✓ Order selesai & terkirim
              </p>
            )}
          </div>
          {/* Deadline */}
          <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-foreground">Deadline: {order.deadline ? formatDate(order.deadline) : "—"}</span>
            </div>
            {(() => {
              const days = order.deadline ? daysUntil(order.deadline) : 999;
              let badgeClass = "bg-gray-200 text-gray-700";
              if (order.status === "shipped") badgeClass = "bg-green-200 text-green-800";
              else if (days < 0) badgeClass = "bg-red-700 text-white";
              else if (days <= 1) badgeClass = "bg-red-500 text-white";
              else if (days < 3) badgeClass = "bg-orange-500 text-white";
              return (
                <Badge variant="secondary" className={badgeClass}>
                  {order.status === "shipped" ? "Selesai" : daysLeftLabel(days)}
                </Badge>
              );
            })()}
          </div>
          {order.specification && (
            <div className="mt-3 pt-3 border-t border-border/60">
              <p className="text-xs font-medium text-muted-foreground mb-1">Spesifikasi:</p>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{order.specification}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 1. BOM — Komposisi Bahan */}
      <Card className="mb-4 card-shadow-lg bg-gray-100 border-2 border-gray-300 hover:shadow-xl hover:-translate-y-0.5 transition-all">
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Komposisi Bahan
          </CardTitle>
          <Button size="sm" className="h-8 gap-1 bg-white text-primary border border-primary/40 hover:bg-blue-50 shadow-sm" onClick={() => setBomOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Tambah
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {bom.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada bahan — klik Tambah untuk mulai</p>
          )}
          {bom.map((item) => {
            const shortage = shortages.find((s) => s.fabricName === item.fabricName);
            const isShort = !!shortage;
            return (
            <div
              key={item.id}
              className={`pb-3 border-b last:border-0 last:pb-0 rounded-lg px-2 -mx-2 transition-all duration-300 ${
                isShort
                  ? "border-red-300 bg-red-50 animate-pulse"
                  : "border-border/60"
              }`}
            >
              <div className="flex items-center justify-between mb-1 gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {isShort && (
                    <span className="shrink-0 text-red-600" title="Stok tidak cukup">
                      ⚠️
                    </span>
                  )}
                  <p className={`text-sm font-semibold truncate ${isShort ? "text-red-700" : "text-foreground"}`}>
                    {item.fabricName}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditBom(item)}
                    className="p-1.5 rounded-md text-muted-foreground hover:bg-blue-50 hover:text-primary transition-colors"
                    title="Edit bahan"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteBomItem(item)}
                    className="p-1.5 rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Hapus bahan"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{item.qtyRequired} kg bersih</span>
                <span>Waste: {item.wastePct}%</span>
                <span>Pakai: {item.qtyActual} kg</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{formatRupiah(item.pricePerKg)}/kg</p>
                <p className="text-sm font-bold">{formatRupiah(item.materialCost)}</p>
              </div>
              {isShort && (
                <p className="text-[11px] text-red-600 font-medium mt-1 bg-red-100 rounded px-2 py-1">
                  Butuh {shortage.needed} kg • Tersedia {shortage.available} kg •{" "}
                  <span className="font-bold">Kurang {(shortage.needed - shortage.available).toFixed(1)} kg</span>
                </p>
              )}
            </div>
            );
          })}
          {bom.length > 0 && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-sm font-semibold text-foreground">Total Material Cost</p>
              <p className="text-sm font-bold text-primary">
                {formatRupiah(bom.reduce((s, i) => s + i.materialCost, 0))}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Timeline Produksi */}
      <Card className="mb-4 card-shadow-lg bg-gray-100 border-2 border-gray-300 hover:shadow-xl hover:-translate-y-0.5 transition-all">
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Timeline Produksi
          </CardTitle>
          <div className="flex items-center gap-2">
            {isDraft && (
              <span className="text-[10px] font-medium text-amber-600 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                ⚠️ Kunci Draft
              </span>
            )}
            <Button
              size="sm"
              className="h-8 gap-1 bg-white text-primary border border-primary/40 hover:bg-blue-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setTimelineOpen(true)}
              disabled={isDraft}
              title={isDraft ? "Mulai produksi dulu untuk update timeline" : undefined}
            >
              Update
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isDraft && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Timeline dikunci saat status Draft. Klik <b>Mulai Produksi</b> di atas untuk mengaktifkan update timeline.
            </p>
          )}
          {timeline.length === 0 && !isDraft && (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada timeline</p>
          )}
          {timeline.length === 0 && isDraft && (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada timeline</p>
          )}
          {timeline.map((stage) => (
            <div key={stage.id} className="flex items-center gap-3 pb-2 border-b border-border/60 last:border-0 last:pb-0">
              <div className="flex-shrink-0">{getStageIcon(stage.status)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{stage.stageName}</p>
                <p className="text-xs text-muted-foreground">
                  {stage.estimatedHrs ? `Estimasi ±${stage.estimatedHrs}h` : ""}
                </p>
              </div>
              <div>{getStageBadge(stage.status)}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 3. Costing — HPP & Harga Jual */}
      <Card className="card-shadow-lg bg-gray-100 border-2 border-gray-300 hover:shadow-xl hover:-translate-y-0.5 transition-all">
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Costing & Harga Jual
          </CardTitle>
          <Button size="sm" className="h-8 gap-1 bg-white text-primary border border-primary/40 hover:bg-blue-50 shadow-sm" onClick={() => setCostingOpen(true)}>
            Hitung Ulang
          </Button>
        </CardHeader>
        <CardContent>
          {costing ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Material Cost</span>
                <span className="font-medium">{formatRupiah(costing.materialCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Upah Jahit</span>
                <span className="font-medium">{formatRupiah(costing.laborCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-foreground">HPP (Total)</span>
                <span className="font-bold">{formatRupiah(costing.hpp)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Markup ({costing.markupPct}%)
                </span>
                <span className="font-medium text-primary">{formatRupiah(costing.sellingPrice - costing.hpp)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ongkos Kirim</span>
                <span className="font-medium">{formatRupiah(costing.shippingCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-foreground">Harga Jual</span>
                <span className="font-bold text-lg text-primary">{formatRupiah(costing.sellingPrice)}</span>
              </div>
              <Separator className="bg-primary/20" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className={`h-4 w-4 ${profitColor(costing.profit)}`} />
                  <span className={`font-semibold ${profitColor(costing.profit)}`}>Profit</span>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${profitColor(costing.profit)}`}>{formatRupiah(costing.profit)}</p>
                  <p className={`text-xs ${profitColor(costing.profit)}`}>Margin {costing.profitMargin.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">Belum ada data costing</p>
              <Button size="sm" onClick={() => setCostingOpen(true)}>Hitung Harga Jual</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddBOMItemDialog
        open={bomOpen}
        onOpenChange={setBomOpen}
        orderId={order.id}
        orderNumber={order.orderNumber}
        onAdded={(item) => {
          // Tambah langsung ke state — tampil tanpa reload (rollback otomatis jika gagal)
          setOrder((prev) =>
            prev ? { ...prev, bomItems: [...(prev.bomItems ?? []), item] } : prev
          );
        }}
      />
      <UpdateTimelineDialog
        open={timelineOpen}
        onOpenChange={setTimelineOpen}
        orderId={order.id}
        orderNumber={order.orderNumber}
        currentStages={timeline.map((t) => ({ name: t.stageName, status: t.status }))}
      />
      <CostingCalculatorDialog open={costingOpen} onOpenChange={setCostingOpen} orderId={order.id} orderNumber={order.orderNumber} />

      {/* Dialog edit BOM */}
      <Dialog open={!!editBomItem} onOpenChange={(o) => !o && setEditBomItem(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleUpdateBom}>
            <DialogHeader>
              <DialogTitle>Edit Bahan BOM</DialogTitle>
              <DialogDescription>{editBomItem?.fabricName}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Jumlah Bersih (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={editBomForm.qtyRequired}
                  onChange={(e) => setEditBomForm((f) => ({ ...f, qtyRequired: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Waste (%)</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={editBomForm.wastePct}
                  onChange={(e) => setEditBomForm((f) => ({ ...f, wastePct: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="default" onClick={() => setEditBomItem(null)} disabled={editBomLoading}>Batal</Button>
              <Button type="submit" disabled={editBomLoading}>
                {editBomLoading ? (
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

      {/* Dialog confirm hapus BOM */}
      <Dialog open={!!deleteBomItem} onOpenChange={(o) => !o && setDeleteBomItem(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Hapus Bahan?
            </DialogTitle>
            <DialogDescription>
              Bahan <b>{deleteBomItem?.fabricName}</b> akan dihapus dari BOM order ini.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
            ⚠️ Bahan ini akan dihapus dari rencana BOM. Stok kain <b>belum</b> dikurangi — stok baru akan dipotong saat order mulai diproduksi.
          </div>
          <DialogFooter>
            <Button type="button" variant="default" onClick={() => setDeleteBomItem(null)} disabled={deleteBomLoading}>Batal</Button>
            <Button
              type="button"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleDeleteBom}
              disabled={deleteBomLoading}
            >
              {deleteBomLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                  Menghapus...
                </span>
              ) : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}