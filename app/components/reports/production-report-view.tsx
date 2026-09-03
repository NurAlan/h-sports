"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Layers,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  CheckCircle2,
  Circle,
  FileSpreadsheet,
  ClipboardList,
} from "lucide-react";
import { api, type ProductionReportData, type ProductionReportOrder } from "@/lib/api";
import { formatRupiah, formatDate, profitColor, cn } from "@/lib/utils";
import { ORDER_STATUS } from "@/lib/status-config";

const PAGE_SIZE = 10;

type SortKey = "orderDate" | "customerName" | "revenue" | "profit";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "orderDate", label: "Tanggal" },
  { value: "customerName", label: "Customer" },
  { value: "revenue", label: "Omzet" },
  { value: "profit", label: "Profit" },
];

function SortSelect({
  sortKey,
  sortDir,
  onToggle,
}: {
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onToggle: (k: SortKey) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
      {SORT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onToggle(opt.value)}
          className={cn(
            "text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors",
            sortKey === opt.value
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
          {sortKey === opt.value && (
            <span className="ml-0.5">{sortDir === "asc" ? "↑" : "↓"}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function ProductionReportView({
  startDate,
  endDate,
  statusFilter = "all",
}: {
  startDate: string;
  endDate: string;
  statusFilter?: string;
}) {
  const [data, setData] = useState<ProductionReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("orderDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setVisibleCount(PAGE_SIZE);
    api
      .get<ProductionReportData>(
        `/api/reports/produksi?start=${startDate}&end=${endDate}${
          statusFilter && statusFilter !== "all" ? `&status=${statusFilter}` : ""
        }`
      )
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [startDate, endDate, statusFilter]);

  const orders = useMemo(() => data?.orders ?? [], [data]);

  const sortedOrders = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...orders].sort((a, b) => {
      let va: number | string;
      let vb: number | string;
      switch (sortKey) {
        case "customerName":
          va = a.customerName;
          vb = b.customerName;
          break;
        case "revenue":
          va = a.revenue;
          vb = b.revenue;
          break;
        case "profit":
          va = a.profit;
          vb = b.profit;
          break;
        default:
          va = a.orderDate;
          vb = b.orderDate;
      }
      if (typeof va === "string" && typeof vb === "string") return va.localeCompare(vb) * dir;
      return ((va as number) - (vb as number)) * dir;
    });
  }, [orders, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const visibleOrders = sortedOrders.slice(0, visibleCount);
  const hasMore = visibleCount < sortedOrders.length;

  const handleExportCSV = () => {
    const header = [
      "Tanggal", "No Order", "Customer", "Status", "Deadline",
      "Stage", "On-time", "Omzet", "Material", "Upah", "Biaya Lain", "Ongkir", "HPP", "Profit", "Margin %",
    ];
    const rows = sortedOrders.map((o) => [
      o.orderDate,
      o.orderNumber,
      o.customerName,
      o.status,
      o.deadline ?? "",
      `${o.stagesCompleted}/${o.stagesTotal}`,
      o.onTime === null ? "-" : o.onTime ? "Ya" : "Tidak",
      o.revenue,
      o.materialCost,
      o.laborCost,
      o.otherCostTotal,
      o.shippingCost,
      o.hpp,
      o.profit,
      o.profitMargin.toFixed(1),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-produksi-${startDate}-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const topFabrics = data?.topFabrics ?? [];
  const maxKg = topFabrics.reduce((m, f) => Math.max(m, f.kg), 0);

  return (
    <div className="space-y-4">
      {/* Kain terbanyak dipakai */}
      <Card className="card-shadow-lg bg-white border-stone-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-4 w-4 text-teal-600" />
            Kain Terbanyak Dipakai
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {topFabrics.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Belum ada pemakaian kain di periode ini
            </p>
          ) : (
            topFabrics.map((f, i) => (
              <div key={f.fabricId} className="flex items-center gap-3">
                <span
                  className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                    i === 0 ? "bg-teal-100 text-teal-700" : "bg-stone-100 text-muted-foreground"
                  )}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground truncate">{f.name}</p>
                  <div className="h-1.5 rounded bg-stone-100 mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{ width: `${maxKg ? (f.kg / maxKg) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <p className="text-base font-semibold text-violet-700 whitespace-nowrap">
                  {f.kg.toLocaleString("id-ID")} kg
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Riwayat Order */}
      <Card className="card-shadow-lg bg-white border-stone-300">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              Riwayat Order
              <span className="text-[11px] font-normal text-muted-foreground">
                {sortedOrders.length} order
              </span>
            </CardTitle>
            <SortSelect sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-base text-muted-foreground py-8">Memuat...</p>
          ) : sortedOrders.length === 0 ? (
            <div className="py-8 text-center">
              <ClipboardList className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Tidak ada order dalam rentang tanggal ini</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleOrders.map((o: ProductionReportOrder) => {
                const statusCfg = ORDER_STATUS[o.status] ?? ORDER_STATUS.draft;
                const isExpanded = expandedId === o.id;
                const isRugi = o.profit < 0;
                return (
                  <div key={o.id}>
                    {/* Collapsed card — mirrors keuangan layout */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : o.id)}
                      className="w-full flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-left transition-colors hover:bg-stone-100"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <ChevronRight
                            className={cn(
                              "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                              isExpanded && "rotate-90"
                            )}
                          />
                          <span className="text-base font-semibold text-foreground truncate">
                            {o.orderNumber}
                          </span>
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0", statusCfg.className)}>
                            {statusCfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground ml-5">
                          <span>{formatDate(o.orderDate)}</span>
                          <span>•</span>
                          <span className="truncate">{o.customerName}</span>
                          {o.deadline && (
                            <>
                              <span>•</span>
                              <span className="truncate">Deadline {formatDate(o.deadline)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-bold text-foreground tabular-nums">
                          {formatRupiah(o.revenue)}
                        </p>
                        <p className={cn("text-sm tabular-nums font-medium", isRugi ? "text-red-600" : "text-green-600")}>
                          {isRugi ? "" : "+"}{formatRupiah(o.profit)}
                        </p>
                      </div>
                    </button>

                    {/* Expanded accordion */}
                    {isExpanded && (
                      <div className="mx-4 mb-2 mt-1 rounded-xl border border-gray-100 bg-white p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Material Cost</span>
                            <span className="font-medium">{formatRupiah(o.materialCost)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Upah Jahit</span>
                            <span className="font-medium">{formatRupiah(o.laborCost)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ongkos Kirim</span>
                            <span className="font-medium">{formatRupiah(o.shippingCost)}</span>
                          </div>
                          {o.otherCostTotal > 0 && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Biaya Lain</span>
                                <span className="font-semibold text-primary">{formatRupiah(o.otherCostTotal)}</span>
                              </div>
                              {o.otherCosts.map((c, i) => (
                                <div key={i} className="flex justify-between pl-3 col-span-1">
                                  <span className="text-muted-foreground">↳ {c.label}</span>
                                  <span className="font-medium">{formatRupiah(c.amount)}</span>
                                </div>
                              ))}
                            </>
                          )}
                          <div className="flex justify-between col-span-2 sm:col-span-3 border-t border-stone-200 pt-2 mt-1">
                            <span className="font-semibold">HPP (Total)</span>
                            <span className="font-bold">{formatRupiah(o.hpp)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {o.pricingMethod === "markup" ? `Markup (${o.markupPct ?? 0}%)` : "Profit Tetap"}
                            </span>
                            <span className="font-medium text-primary">
                              {formatRupiah(o.pricingMethod === "markup"
                                ? o.hpp * ((o.markupPct ?? 0) / 100)
                                : o.fixedProfit)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Harga Jual</span>
                            <span className="font-bold text-primary">{formatRupiah(o.revenue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={profitColor(o.profit)}>Profit</span>
                            <span className={cn("font-bold", profitColor(o.profit))}>{formatRupiah(o.profit)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Margin</span>
                            <span className={cn("font-medium", profitColor(o.profit))}>{o.profitMargin.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Deadline</span>
                            <span className="font-medium">{o.deadline ? formatDate(o.deadline) : "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">On-time</span>
                            <span className="font-medium">
                              {o.onTime === null ? (
                                "—"
                              ) : o.onTime ? (
                                <span className="inline-flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Tepat waktu
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-500">
                                  <Circle className="h-3.5 w-3.5" /> Terlambat
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Stage</span>
                            <span className="font-medium">{o.stagesCompleted}/{o.stagesTotal}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="mt-3 pt-3 border-t border-stone-100">
              <Button
                variant="outline"
                className="w-full text-sm text-muted-foreground"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              >
                Muat lebih banyak ({sortedOrders.length - visibleCount} tersisa)
              </Button>
            </div>
          )}

          {/* Export */}
          <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
            <Button variant="outline" className="flex-1 gap-1.5" onClick={handleExportCSV}>
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
