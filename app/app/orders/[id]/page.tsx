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
import { formatRupiah, formatDate, daysUntil, daysLeftLabel, profitColor, cn } from "@/lib/utils";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogBody, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddBOMItemDialog } from "@/components/dialogs/add-bom-item-dialog";
import { UpdateTimelineDialog } from "@/components/dialogs/update-timeline-dialog";
import { CostingCalculatorDialog } from "@/components/dialogs/costing-calculator-dialog";
import { EditCustomerDialog } from "@/components/dialogs/edit-customer-dialog";
import { MenuGuide } from "@/components/tutorial/menu-guide";
import { ORDER_STATUS } from "@/lib/status-config";

// Workflow status: draft → in_production → qc → shipped
const STATUS_FLOW = ["draft", "in_production", "qc", "shipped"] as const;
const NEXT_ACTION: Record<string, { label: string; next: string }> = {
  draft: { label: "Mulai Produksi", next: "in_production" },
  in_production: { label: "Masuk QC", next: "qc" },
  qc: { label: "Tandai Selesai", next: "shipped" },
};

function getStageIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />;
    case "in_progress":
      return <Clock className="h-5 w-5 text-sky-600 shrink-0 motion-safe:animate-pulse" />;
    default:
      return <Circle className="h-5 w-5 text-stone-400 shrink-0" />;
  }
}

function getStageBadge(status: string) {
  const variants: Record<string, { label: string; className: string }> = {
    completed: { label: "Selesai", className: "bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold" },
    in_progress: { label: "Sedang Dikerjakan", className: "bg-sky-100 text-sky-800 border-sky-300 font-semibold" },
    not_started: { label: "Belum Dimulai", className: "bg-stone-100 text-stone-700 border-stone-300" },
  };
  const config = variants[status] || { label: status, className: "bg-stone-100 text-stone-700" };
  return (
    <Badge variant="secondary" className={`text-xs border px-2.5 py-0.5 ${config.className}`}>
      {config.label}
    </Badge>
  );
}

function formatTimelineDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function calculateDuration(startStr?: string | null, endStr?: string | null): string | null {
  if (!startStr || !endStr) return null;
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return null;
  const diffHours = Math.max(1, Math.round((end - start) / (1000 * 60 * 60)));
  if (diffHours < 24) {
    return `${diffHours} jam`;
  }
  const diffDays = Math.max(1, Math.round(diffHours / 24));
  return `${diffDays} hari`;
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order & {
    bomItems?: Array<{
      id: string;
      fabricId: string;
      fabricColorId: string;
      batchId?: string | null;
      fabricName: string;
      colorName: string;
      qtyRequired: number;
      wastePct: number;
      qtyActual: number;
      pricePerKg: number;
      materialCost: number;
      batchInfo?: {
        purchaseDate: string;
        supplierName: string;
        pricePerKg: number;
        qtyRemaining: number;
      } | null;
    }>;
    timelines?: Array<{
      id: string;
      stageName: string;
      status: string;
      estimatedHrs: number | null;
      actualStart?: string | null;
      actualEnd?: string | null;
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
      otherCostTotal: number;
      profit: number;
      profitMargin: number;
    } | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [stockLoading, setStockLoading] = useState(false);

  /** Lazy load stok — key = fabricColorId (stok per warna) */
  const loadStockIfNeeded = async () => {
    if (Object.keys(stockMap).length > 0) return;
    setStockLoading(true);
    try {
      const invData = await api.get<{ colors: { colorId: string; stock: number }[] }[]>("/api/inventory");
      const map: Record<string, number> = {};
      for (const fabric of invData) {
        for (const c of fabric.colors ?? []) {
          map[c.colorId] = c.stock;
        }
      }
      setStockMap(map);
    } catch { /* gagal fetch stok — shortages kosong */ }
    finally { setStockLoading(false); }
  };

  const [bomOpen, setBomOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [costingOpen, setCostingOpen] = useState(false);
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const toast = useToast();
  type BomItemType = {
    id: string;
    fabricId: string;
    fabricColorId?: string;
    batchId?: string | null;
    fabricName: string;
    colorName?: string;
    qtyRequired: number;
    wastePct?: number;
    qtyActual?: number;
    pricePerKg: number;
    materialCost: number;
    batchInfo?: {
      purchaseDate: string;
      supplierName: string;
      pricePerKg: number;
      qtyRemaining: number;
    } | null;
  };
  const [editBomItem, setEditBomItem] = useState<BomItemType | null>(null);
  const [deleteBomItem, setDeleteBomItem] = useState<BomItemType | null>(null);
  const [editBomForm, setEditBomForm] = useState({ qtyRequired: "" });
  const [editBomLoading, setEditBomLoading] = useState(false);
  const [deleteBomLoading, setDeleteBomLoading] = useState(false);
  const [highlightedBomId, setHighlightedBomId] = useState<string | null>(null);

  useEffect(() => {
    api.get<typeof order>(`/api/orders/${params.id}`)
      .then((orderData) => {
        setOrder(orderData);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Muat stok inventory bersamaan — supaya banner shortage akurat sejak awal
    api
      .get<{ colors: { colorId: string; stock: number }[] }[]>("/api/inventory")
      .then((invData) => {
        const map: Record<string, number> = {};
        for (const fabric of invData) {
          for (const c of fabric.colors ?? []) {
            map[c.colorId] = c.stock;
          }
        }
        setStockMap(map);
      })
      .catch(() => {});
  }, [params.id]);

  // Data BOM (null-safe saat loading) — hook HARUS sebelum early return
  const bom = order?.bomItems ?? [];

  // Cek stok cukup untuk semua BOM (validasi SEBELUM mulai produksi) — per FabricColor
  const shortages = useMemo(() => {
    const list: { fabricName: string; needed: number; available: number }[] = [];
    for (const item of bom) {
      const available = stockMap[item.fabricColorId] ?? 0;
      if (available < item.qtyActual) {
        list.push({
          fabricName: `${item.fabricName} — ${item.colorName}`,
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
        <Link href="/orders" className="text-primary text-base hover:underline">← Kembali ke Orders</Link>
      </div>
    );
  }

  const status = ORDER_STATUS[order.status] || ORDER_STATUS.draft;
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
   * - Mulai Produksi (draft → in_production): BOM tidak boleh kosong
   * - Masuk QC (in_production → qc): semua stage produksi harus selesai
   * - Tandai Selesai (qc → shipped): stage QC harus selesai
   */
  const canAdvance = (() => {
    if (!nextAction) return false;
    if (nextAction.next === "in_production") {
      return bom.length > 0; // BOM harus terisi sebelum mulai produksi
    }
    if (nextAction.next === "qc") {
      return allProductionDone;
    }
    if (nextAction.next === "shipped") {
      return qcDone;
    }
    return true;
  })();

  const advanceBlockReason = (() => {
    if (!nextAction || canAdvance) return null;
    if (nextAction.next === "in_production") {
      return "BOM masih kosong — tambah bahan dulu sebelum mulai produksi";
    }
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
          ? `Order ${order.orderNumber} masuk produksi — stok dipotong dari batch yang dipilih`
          : `Order ${order.orderNumber} → ${ORDER_STATUS[nextAction.next]?.label ?? nextAction.next}`
      );
      // Refetch detail order — timeline auto-created di server langsung tampil
      const fresh = await api.get<typeof order>(`/api/orders/${order.id}`);
      setOrder(fresh);
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
    });
  };

  /** Simpan perubahan BOM */
  const handleUpdateBom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBomItem || !order) return;
    setEditBomLoading(true);
    try {
      await api.patch<BomItemType>(
        `/api/orders/${order.id}/bom/${editBomItem.id}`,
        {
          qtyRequired: parseFloat(editBomForm.qtyRequired),
        }
      );
      toast.success(`Bahan ${editBomItem.fabricName} diperbarui`);
      setEditBomItem(null);
      // Refetch detail order agar costing dan BOM sinkron
      const fresh = await api.get<typeof order>(`/api/orders/${order.id}`);
      setOrder(fresh);
      // Flash highlight pada card BOM yang baru diperbarui
      setHighlightedBomId(editBomItem.id);
      setTimeout(() => setHighlightedBomId(null), 1500);
    } catch (err) {
      toast.error(`Gagal update: ${(err as Error).message}`);
    } finally {
      setEditBomLoading(false);
    }
  };

  /** Hapus BOM item */
  const handleDeleteBom = async () => {
    if (!deleteBomItem || !order) return;
    setDeleteBomLoading(true);
    try {
      await api.del(`/api/orders/${order.id}/bom/${deleteBomItem.id}`);
      toast.success(`Bahan ${deleteBomItem.fabricName} dihapus`);
      setDeleteBomItem(null);
      // Refetch detail order agar costing dan BOM sinkron
      const fresh = await api.get<typeof order>(`/api/orders/${order.id}`);
      setOrder(fresh);
    } catch (err) {
      toast.error(`Gagal hapus: ${(err as Error).message}`);
    } finally {
      setDeleteBomLoading(false);
    }
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      {/* Top Bar: Back + Guide */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <Link href="/orders" className="inline-flex items-center gap-1.5 text-base font-medium text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Orders
        </Link>
        <MenuGuide menuKey="order_detail" />
      </div>

      {/* Header Order */}
      <Card className="mb-4 card-shadow bg-white border border-stone-200 hover:border-stone-300 transition-all">
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-xl font-bold text-foreground truncate">{order.customerName}</p>
              <button
                type="button"
                onClick={() => setEditCustomerOpen(true)}
                aria-label="Edit nama customer"
                title="Edit nama customer"
                className="p-1 rounded-md text-muted-foreground hover:bg-white hover:text-primary transition-colors shrink-0"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
            <Badge variant="secondary" className={status.className}>{status.label}</Badge>
          </div>
          <p className="text-base text-muted-foreground mb-1">{order.orderNumber}</p>
          {order.customerContact && (
            <p className="text-sm text-muted-foreground mb-1">{order.customerContact}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {order.qtyItems} pcs</span>
            <span>Order: {formatDate(order.orderDate)}</span>
          </div>

          {/* Workflow status — Draft → Produksi → QC → Selesai */}
          <div className="mt-4">
            <div className="flex items-center gap-1 mb-3">
              {STATUS_FLOW.map((s, i) => {
                const config = ORDER_STATUS[s];
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
                              : "bg-white border-stone-300 text-stone-400"
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
                <p className="text-sm font-semibold text-red-700 mb-1">
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
                className={`w-full h-12 text-base font-semibold shadow-md active:scale-[0.98] transition-all gap-2 ${!canAdvance ? "opacity-50 cursor-not-allowed" : ""}`}
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
              <p className="text-center text-sm font-medium text-green-600 mt-1">
                ✓ Order selesai & terkirim
              </p>
            )}
          </div>
          {/* Deadline */}
          <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Deadline: {order.deadline ? formatDate(order.deadline) : "—"}</span>
            </div>
            {(() => {
              const days = order.deadline ? daysUntil(order.deadline) : 999;
              let badgeClass = "bg-stone-200 text-stone-700";
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
              <p className="text-sm font-medium text-muted-foreground mb-1">Spesifikasi:</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.specification}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 1. BOM — Komposisi Bahan */}
      <Card className="mb-4 card-shadow bg-white border border-stone-200 hover:border-stone-300 transition-all">
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Komposisi Bahan
          </CardTitle>
          <Button
            size="sm"
            className="h-8 gap-1 bg-white text-primary border border-primary/40 hover:bg-blue-50 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => setBomOpen(true)}
            disabled={!isDraft}
            title={!isDraft ? "BOM tidak bisa diubah setelah produksi dimulai" : undefined}
          >
            <Plus className="h-3.5 w-3.5" /> Tambah
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {bom.length === 0 && (
            <p className="text-base text-muted-foreground text-center py-4">Belum ada bahan — klik Tambah untuk mulai</p>
          )}
          {bom.map((item) => {
            const shortage = shortages.find((s) => s.fabricName === item.fabricName);
            const isShort = !!shortage;
            return (
            <div
              key={item.id}
              className={`pb-3 border-b last:border-0 last:pb-0 rounded-lg px-2 -mx-2 transition-all duration-700 ${
                highlightedBomId === item.id
                  ? "bg-primary/10 ring-2 ring-primary/30"
                  : isShort
                    ? "border-red-300 bg-red-50 animate-pulse"
                    : "border-border/60"
              }`}
            >
              <div className="flex items-center justify-between mb-1 gap-2">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isShort && (
                      <span className="shrink-0 text-red-600" title="Stok tidak cukup">
                        ⚠️
                      </span>
                    )}
                    <p className={`text-base font-semibold truncate ${isShort ? "text-red-700" : "text-foreground"}`}>
                      {item.fabricName} — {item.colorName}
                    </p>
                  </div>
                  {item.batchInfo ? (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-primary font-medium mt-1">
                      <span className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                        Batch: {formatDate(item.batchInfo.purchaseDate)}
                      </span>
                      <span>{formatRupiah(item.pricePerKg)}/kg</span>
                      {item.batchInfo.supplierName && (
                        <span className="text-muted-foreground">• {item.batchInfo.supplierName}</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">{formatRupiah(item.pricePerKg)}/kg</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditBom(item)}
                    disabled={!isDraft}
                    className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg transition-all duration-150 active:scale-90 ${!isDraft ? "opacity-30 cursor-not-allowed text-muted-foreground" : "bg-amber-50 text-primary border border-primary/30 hover:bg-amber-100 hover:text-amber-700 shadow-xs"}`}
                    title={!isDraft ? "BOM tidak bisa diubah setelah produksi dimulai" : "Edit bahan"}
                    aria-label="Edit bahan"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteBomItem(item)}
                    disabled={!isDraft}
                    className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg transition-all duration-150 active:scale-90 ${!isDraft ? "opacity-30 cursor-not-allowed text-muted-foreground" : "bg-red-50 text-red-600 border border-red-200/80 hover:bg-red-100 hover:text-red-700 shadow-xs"}`}
                    title={!isDraft ? "BOM tidak bisa diubah setelah produksi dimulai" : "Hapus bahan"}
                    aria-label="Hapus bahan"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm mt-1.5 pt-1.5 border-t border-dashed border-border/60">
                <span className="text-muted-foreground">Kebutuhan: <strong className="text-foreground font-semibold">{item.qtyRequired} kg</strong></span>
                <span className="text-base font-bold text-foreground">{formatRupiah(item.materialCost)}</span>
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
              <p className="text-base font-semibold text-foreground">Total Material Cost</p>
              <p className="text-base font-bold text-primary">
                {formatRupiah(bom.reduce((s, i) => s + i.materialCost, 0))}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Costing — HPP & Harga Jual */}
      <Card className="mb-4 card-shadow bg-white border border-stone-200 hover:border-stone-300 transition-all">
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Costing & Harga Jual
          </CardTitle>
          <Button 
            size="sm" 
            className="h-8 gap-1 bg-white text-primary border border-primary/40 hover:bg-blue-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" 
            onClick={() => setCostingOpen(true)}
            disabled={bom.length === 0}
            title={bom.length === 0 ? "Tambah bahan dulu untuk menghitung costing" : undefined}
          >
            Hitung Ulang
          </Button>
        </CardHeader>
        <CardContent>
          {costing ? (
            <div className="space-y-3">
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">Material Cost</span>
                <span className="font-medium">{formatRupiah(costing.materialCost)}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">Upah Jahit</span>
                <span className="font-medium">{formatRupiah(costing.laborCost)}</span>
              </div>
              {costing.otherCostTotal > 0 && (
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">Biaya Lain-lain</span>
                  <span className="font-medium">{formatRupiah(costing.otherCostTotal)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base">
                <span className="font-semibold text-foreground">HPP (Total)</span>
                <span className="font-bold">{formatRupiah(costing.hpp)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">
                  {costing.pricingMethod === "markup"
                    ? `Markup (${costing.markupPct}%)`
                    : "Profit Tetap"}
                </span>
                <span className="font-medium text-primary">
                  {formatRupiah(costing.pricingMethod === "markup"
                    ? costing.hpp * ((costing.markupPct ?? 0) / 100)
                    : costing.fixedProfit)}
                </span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">Ongkos Kirim</span>
                <span className="font-medium">{formatRupiah(costing.shippingCost)}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="font-semibold text-foreground">Harga Jual</span>
                <span className="font-bold text-xl text-primary">{formatRupiah(costing.sellingPrice)}</span>
              </div>
              <Separator className="bg-primary/20" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className={`h-4 w-4 ${profitColor(costing.profit)}`} />
                  <span className={`font-semibold ${profitColor(costing.profit)}`}>Profit</span>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-xl ${profitColor(costing.profit)}`}>{formatRupiah(costing.profit)}</p>
                  <p className={`text-sm ${profitColor(costing.profit)}`}>Margin {costing.profitMargin.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-base text-muted-foreground mb-2">Belum ada data costing</p>
              <Button 
                size="sm" 
                onClick={() => setCostingOpen(true)}
                disabled={bom.length === 0}
                title={bom.length === 0 ? "Tambah bahan dulu untuk menghitung costing" : undefined}
              >
                Hitung Harga Jual
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Timeline Produksi — Accessible Vertical Stepper */}
      <Card className="card-shadow bg-white border border-stone-200 hover:border-stone-300 transition-all">
        <CardHeader className="pb-3 flex-row items-center justify-between border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Timeline Produksi</CardTitle>
              <p className="text-xs text-muted-foreground">Riwayat tanggal & progress tiap tahapan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDraft && (
              <span className="text-[11px] font-medium text-amber-700 bg-amber-100 border border-amber-300 rounded-full px-2.5 py-0.5 whitespace-nowrap">
                Kunci Draft
              </span>
            )}
            <Button
              size="sm"
              className="min-h-[38px] px-3.5 gap-1.5 bg-blue-600 text-white font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => setTimelineOpen(true)}
              disabled={isDraft}
              title={isDraft ? "Mulai produksi dulu untuk update timeline" : undefined}
            >
              <Clock className="h-4 w-4" />
              Update Timeline
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 pb-4">
          {isDraft && (
            <div className="mb-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              <span className="font-bold">⚠️</span>
              <p>Timeline dikunci saat status Draft. Klik <b>Mulai Produksi</b> di atas untuk mengaktifkan pelacakan tanggal produksi.</p>
            </div>
          )}

          {timeline.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">
                {isDraft
                  ? "Timeline akan aktif otomatis setelah order mulai produksi"
                  : "Belum ada tahapan timeline"}
              </p>
            </div>
          )}

          {timeline.length > 0 && (
            <div className="relative pl-6 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-3 before:w-0.5 before:bg-stone-200">
              {timeline.map((stage) => {
                const duration = calculateDuration(stage.actualStart, stage.actualEnd);
                const isCompleted = stage.status === "completed";
                const isInProgress = stage.status === "in_progress";

                return (
                  <div key={stage.id} className="relative group">
                    {/* Stepper Node Icon */}
                    <div className="absolute -left-6 top-0.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-4 ring-white">
                      {getStageIcon(stage.status)}
                    </div>

                    {/* Content Box */}
                    <div className={cn(
                      "rounded-xl border p-3 transition-all",
                      isInProgress 
                        ? "border-sky-300 bg-sky-50/50 shadow-xs animate-production-pulse" 
                        : isCompleted 
                          ? "border-stone-200 bg-stone-50/70" 
                          : "border-stone-200 bg-white animate-production-blink"
                    )}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-sm font-bold text-foreground capitalize truncate">
                          {stage.stageName}
                        </span>
                        {getStageBadge(stage.status)}
                      </div>

                      {/* Date details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-muted-foreground pt-1">
                        {stage.actualStart ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground/80">Mulai:</span>
                            <span className="font-medium text-foreground">{formatTimelineDate(stage.actualStart)}</span>
                          </div>
                        ) : (
                          <div className="text-muted-foreground/60 italic text-[11px]">Belum dimulai</div>
                        )}
                        {stage.actualEnd && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground/80">Selesai:</span>
                            <span className="font-medium text-foreground">{formatTimelineDate(stage.actualEnd)}</span>
                          </div>
                        )}
                      </div>

                      {/* Duration & status caption */}
                      {(duration || isInProgress || stage.estimatedHrs) && (
                        <div className="mt-2 flex items-center justify-between text-[11px] border-t border-stone-200/80 pt-1.5">
                          <span className="text-muted-foreground">
                            {stage.estimatedHrs ? `Estimasi ±${stage.estimatedHrs} jam` : ""}
                          </span>
                          {duration && (
                            <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Durasi: {duration}
                            </span>
                          )}
                          {isInProgress && !duration && (
                            <span className="font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded motion-safe:animate-pulse">
                              Sedang dikerjakan
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
        existingBatchIds={(order.bomItems ?? []).map((b) => b.batchId).filter(Boolean) as string[]}
        onAdded={async (newItem) => {
          // Refetch data order agar BOM dan costing terbaru sinkron
          const fresh = await api.get<typeof order>(`/api/orders/${order.id}`);
          setOrder(fresh);
          // Flash highlight pada card BOM baru
          if (newItem?.id) {
            setHighlightedBomId(newItem.id);
            setTimeout(() => setHighlightedBomId(null), 1500);
          }
        }}
      />
      <UpdateTimelineDialog
        open={timelineOpen}
        onOpenChange={setTimelineOpen}
        orderId={order.id}
        orderNumber={order.orderNumber}
        currentStages={timeline.map((t) => ({
          name: t.stageName,
          status: t.status,
          estimatedHrs: t.estimatedHrs,
          actualStart: t.actualStart,
          actualEnd: t.actualEnd,
        }))}
        onUpdated={(newTimeline) => {
          // Timeline langsung tampil tanpa reload — update state dari response API
          setOrder((prev) => (prev ? { ...prev, timelines: newTimeline } : prev));
        }}
      />
      <CostingCalculatorDialog open={costingOpen} onOpenChange={setCostingOpen} orderId={order.id} orderNumber={order.orderNumber} />
      <EditCustomerDialog
        open={editCustomerOpen}
        onOpenChange={setEditCustomerOpen}
        orderId={order.id}
        initialCustomerName={order.customerName}
        initialCustomerContact={order.customerContact}
        onSuccess={(updated) => {
          setOrder((prev) =>
            prev
              ? {
                  ...prev,
                  customerName: updated.customerName,
                  customerContact: updated.customerContact ?? null,
                }
              : prev
          );
        }}
      />

      {/* Dialog edit BOM */}
      <Dialog open={!!editBomItem} onOpenChange={(o) => !o && setEditBomItem(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Bahan BOM</DialogTitle>
            <DialogDescription>
              {editBomItem?.fabricName} — {editBomItem?.colorName}
              {editBomItem?.batchInfo && (
                <span className="block text-xs text-primary font-medium mt-0.5">
                  Batch: {formatDate(editBomItem.batchInfo.purchaseDate)} ({formatRupiah(editBomItem.pricePerKg)}/kg)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateBom} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <DialogBody>
              <div className="grid gap-4 py-2">
                <div className="grid gap-1.5">
                  <Label>Jumlah Satuan (kg) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={editBomForm.qtyRequired}
                    onChange={(e) => setEditBomForm({ qtyRequired: e.target.value })}
                    required
                  />
                  {editBomItem && (
                    <p className="text-xs text-muted-foreground">
                      Harga: {formatRupiah(editBomItem.pricePerKg)}/kg • Total Baru:{" "}
                      <span className="font-semibold text-primary">
                        {formatRupiah((parseFloat(editBomForm.qtyRequired) || 0) * editBomItem.pricePerKg)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditBomItem(null)} disabled={editBomLoading}>Batal</Button>
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
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-700">
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