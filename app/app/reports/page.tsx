"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Wallet,
  TrendingUp,
  Percent,
  ShoppingCart,
  Download,
  FileSpreadsheet,
  Trophy,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  orders,
  getCostingForOrder,
  bomItems,
} from "@/lib/mock-data";
import { formatRupiah, formatDate, shiftMonth, cn } from "@/lib/utils";
import { PeriodFilter, type PeriodPreset } from "@/components/reports/period-filter";
import { ComparisonBarChart } from "@/components/reports/comparison-bar-chart";
import { useToast } from "@/components/toast/toast-provider";

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-700" },
  in_production: { label: "Produksi", className: "bg-blue-100 text-blue-700" },
  qc: { label: "QC", className: "bg-amber-100 text-amber-700" },
  shipped: { label: "Selesai", className: "bg-green-100 text-green-700" },
};

type SortKey = "orderDate" | "customerName" | "qtyItems" | "omzet" | "hpp" | "profit" | "margin";

function getRangeForPreset(preset: PeriodPreset): { start: string; end: string } {
  switch (preset) {
    case "thisMonth":
      return { start: "2026-08-01", end: "2026-08-31" };
    case "lastMonth":
      return { start: "2026-07-01", end: "2026-07-31" };
    case "last3Months":
      return { start: "2026-06-01", end: "2026-08-31" };
    default:
      return { start: "2026-08-01", end: "2026-08-31" };
  }
}

export default function ReportsPage() {
  const toast = useToast();
  const [preset, setPreset] = useState<PeriodPreset>("thisMonth");
  const initial = getRangeForPreset("thisMonth");
  const [startDate, setStartDate] = useState(initial.start);
  const [endDate, setEndDate] = useState(initial.end);
  const [sortKey, setSortKey] = useState<SortKey>("orderDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const isCustom = preset === "custom";

  const handlePresetChange = (p: PeriodPreset) => {
    setPreset(p);
    if (p !== "custom") {
      const r = getRangeForPreset(p);
      setStartDate(r.start);
      setEndDate(r.end);
    }
  };

  const handleReset = () => {
    setPreset("thisMonth");
    const r = getRangeForPreset("thisMonth");
    setStartDate(r.start);
    setEndDate(r.end);
  };

  // Range aktif
  const range = useMemo(() => {
    if (preset === "custom") {
      return { start: startDate || "2026-01-01", end: endDate || "2026-12-31" };
    }
    return getRangeForPreset(preset);
  }, [preset, startDate, endDate]);

  // Periode sebelumnya (geser 1 bulan mundur)
  const prevRange = useMemo(
    () => ({ start: shiftMonth(range.start, -1), end: shiftMonth(range.end, -1) }),
    [range]
  );

  const computeSummary = (ordersInRange: typeof orders) => {
    let revenue = 0, hpp = 0, profit = 0, counted = 0;
    for (const o of ordersInRange) {
      const c = getCostingForOrder(o.id);
      if (!c) continue;
      revenue += c.sellingPrice;
      hpp += c.hpp;
      profit += c.profit;
      counted++;
    }
    return { revenue, hpp, profit, counted, margin: revenue > 0 ? (profit / revenue) * 100 : 0 };
  };

  const currOrders = useMemo(
    () => orders.filter((o) => o.orderDate >= range.start && o.orderDate <= range.end),
    [range]
  );
  const prevOrders = useMemo(
    () => orders.filter((o) => o.orderDate >= prevRange.start && o.orderDate <= prevRange.end),
    [prevRange]
  );

  const summary = useMemo(() => computeSummary(currOrders), [currOrders]);
  const prevSummary = useMemo(() => computeSummary(prevOrders), [prevOrders]);

  const pctChange = (curr: number, prev: number) =>
    prev > 0 ? ((curr - prev) / prev) * 100 : null;

  const sortedOrders = useMemo(() => {
    const rows = currOrders.map((o) => {
      const c = getCostingForOrder(o.id);
      return {
        order: o,
        omzet: c?.sellingPrice ?? null,
        hpp: c?.hpp ?? null,
        profit: c?.profit ?? null,
        margin: c?.profitMargin ?? null,
      };
    });
    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      let va: number | string;
      let vb: number | string;
      switch (sortKey) {
        case "orderDate": va = a.order.orderDate; vb = b.order.orderDate; break;
        case "customerName": va = a.order.customerName; vb = b.order.customerName; break;
        case "qtyItems": va = a.order.qtyItems; vb = b.order.qtyItems; break;
        case "omzet": va = a.omzet ?? -1; vb = b.omzet ?? -1; break;
        case "hpp": va = a.hpp ?? -1; vb = b.hpp ?? -1; break;
        case "profit": va = a.profit ?? -1; vb = b.profit ?? -1; break;
        case "margin": va = a.margin ?? -1; vb = b.margin ?? -1; break;
        default: va = a.order.orderDate; vb = b.order.orderDate;
      }
      if (typeof va === "string" && typeof vb === "string") return va.localeCompare(vb) * dir;
      return ((va as number) - (vb as number)) * dir;
    });
    return rows;
  }, [currOrders, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <th
      className="py-2 pr-3 font-semibold text-muted-foreground cursor-pointer select-none whitespace-nowrap"
      onClick={() => toggleSort(k)}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        {sortKey === k ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3 w-3 text-primary" />
          ) : (
            <ArrowDown className="h-3 w-3 text-primary" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
        )}
      </span>
    </th>
  );

  // Export CSV (Excel-compatible)
  const handleExportCSV = () => {
    const header = [
      "Tanggal", "No Order", "Customer", "Qty", "Omzet", "Material",
      "Upah", "HPP", "Ongkir", "Profit", "Margin %", "Status",
    ];
    const rows = currOrders.map((o) => {
      const c = getCostingForOrder(o.id);
      return [
        o.orderDate,
        o.orderNumber,
        o.customerName,
        o.qtyItems,
        c?.sellingPrice ?? "",
        c?.materialCost ?? "",
        c?.laborCost ?? "",
        c?.hpp ?? "",
        c?.shippingCost ?? "",
        c?.profit ?? "",
        c?.profitMargin?.toFixed(1) ?? "",
        o.status,
      ];
    });
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-h-sport-${range.start}-${range.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Laporan Excel berhasil diunduh");
  };

  const handleExportPDF = () => {
    toast.info("Export PDF akan tersedia setelah integrasi API");
  };

  // Top ranking
  const topCustomers = useMemo(() => {
    const map = new Map<string, { count: number; profit: number }>();
    for (const o of currOrders) {
      const c = getCostingForOrder(o.id);
      if (!c) continue;
      const cur = map.get(o.customerName) || { count: 0, profit: 0 };
      cur.count += 1;
      cur.profit += c.profit;
      map.set(o.customerName, cur);
    }
    return [...map.entries()]
      .sort((a, b) => b[1].profit - a[1].profit)
      .slice(0, 3)
      .map(([name, v]) => ({ name, ...v }));
  }, [currOrders]);

  const topFabrics = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bomItems) {
      map.set(b.fabricName, (map.get(b.fabricName) || 0) + b.qtyActual);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, kg]) => ({ name, kg }));
  }, []);

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <PageHeader title="Laporan" subtitle="Profit, tren & detail transaksi" />

      {/* Filter periode */}
      <Card className="mb-4 card-shadow-lg bg-white border-gray-300">
        <CardContent className="pt-4 pb-4">
          <PeriodFilter
            preset={preset}
            onPresetChange={handlePresetChange}
            startDate={startDate}
            endDate={endDate}
            onStartChange={(v) => { setPreset("custom"); setStartDate(v); }}
            onEndChange={(v) => { setPreset("custom"); setEndDate(v); }}
            isCustom={isCustom}
            onReset={handleReset}
          />
        </CardContent>
      </Card>

      {/* Summary cards dengan perbandingan */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          {
            icon: DollarSign,
            label: "Omzet",
            value: summary.revenue,
            prev: prevSummary.revenue,
            color: "border-blue-200 bg-blue-100",
            iconColor: "text-blue-700",
            labelColor: "text-blue-800",
            valueColor: "text-blue-700",
            subColor: "text-blue-600",
          },
          {
            icon: Wallet,
            label: "HPP",
            value: summary.hpp,
            prev: prevSummary.hpp,
            color: "border-orange-200 bg-orange-100",
            iconColor: "text-orange-700",
            labelColor: "text-orange-800",
            valueColor: "text-orange-700",
            subColor: "text-orange-600",
          },
          {
            icon: TrendingUp,
            label: "Profit",
            value: summary.profit,
            prev: prevSummary.profit,
            color: "border-green-200 bg-green-100",
            iconColor: "text-green-700",
            labelColor: "text-green-800",
            valueColor: "text-green-700",
            subColor: "text-green-600",
          },
          {
            icon: Percent,
            label: "Margin",
            value: summary.margin,
            prev: prevSummary.margin,
            isPercent: true,
            color: "border-violet-200 bg-violet-100",
            iconColor: "text-violet-700",
            labelColor: "text-violet-800",
            valueColor: "text-violet-700",
            subColor: "text-violet-600",
          },
        ].map((s) => {
          const Icon = s.icon;
          const change = s.isPercent ? null : pctChange(s.value, s.prev);
          return (
            <Card key={s.label} className={`border card-shadow-lg ${s.color}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`h-4 w-4 ${s.iconColor}`} />
                  <p className={`text-xs font-medium ${s.labelColor}`}>{s.label}</p>
                </div>
                <p className={`text-lg font-bold truncate ${s.valueColor}`}>
                  {s.isPercent ? `${s.value.toFixed(1)}%` : formatRupiah(s.value)}
                </p>
                <p className={`text-[11px] ${s.subColor}`}>
                  {change === null
                    ? "Periode baru (sebelumnya 0)"
                    : `${change >= 0 ? "↑" : "↓"} ${Math.abs(change).toFixed(1)}% vs periode lalu`}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bar chart omzet vs HPP */}
      <Card className="mb-4 card-shadow-lg bg-white border-gray-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Omzet vs HPP (6 bulan)</CardTitle>
        </CardHeader>
        <CardContent>
          <ComparisonBarChart />
        </CardContent>
      </Card>

      {/* Tabel detail */}
      <Card className="mb-4 card-shadow-lg bg-white border-gray-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" />
            Detail Order
            <span className="text-[11px] font-normal text-muted-foreground">
              {currOrders.length} order • klik header untuk sort
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full text-left text-xs min-w-[880px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <SortHeader label="Tanggal" k="orderDate" />
                  <th className="py-2 pr-3 font-semibold text-muted-foreground">No. Order</th>
                  <SortHeader label="Customer" k="customerName" />
                  <SortHeader label="Qty" k="qtyItems" />
                  <SortHeader label="Omzet" k="omzet" />
                  <SortHeader label="HPP" k="hpp" />
                  <SortHeader label="Profit" k="profit" />
                  <SortHeader label="Margin" k="margin" />
                  <th className="py-2 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.map(({ order, omzet, hpp, profit, margin }) => {
                  const status = statusConfig[order.status] || statusConfig.draft;
                  return (
                    <tr key={order.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-2.5 pr-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(order.orderDate)}
                      </td>
                      <td className="py-2.5 pr-3 font-semibold text-foreground whitespace-nowrap">
                        {order.orderNumber}
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground max-w-[110px] truncate">
                        {order.customerName}
                      </td>
                      <td className="py-2.5 pr-3 text-right">{order.qtyItems}</td>
                      <td className="py-2.5 pr-3 text-right font-medium whitespace-nowrap">
                        {omzet !== null ? formatRupiah(omzet) : "-"}
                      </td>
                      <td className="py-2.5 pr-3 text-right whitespace-nowrap">
                        {hpp !== null ? formatRupiah(hpp) : "-"}
                      </td>
                      <td
                        className={cn(
                          "py-2.5 pr-3 text-right font-semibold whitespace-nowrap",
                          profit === null ? "text-muted-foreground" : profit >= 0 ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {profit !== null ? formatRupiah(profit) : "-"}
                      </td>
                      <td className="py-2.5 pr-3 text-right whitespace-nowrap">
                        {margin !== null ? `${margin.toFixed(1)}%` : "-"}
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${status.className}`}>
                          {status.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {sortedOrders.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      Tidak ada order dalam rentang tanggal ini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Export buttons */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
            <Button variant="outline" className="flex-1 gap-1.5" onClick={handleExportCSV}>
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              Export Excel
            </Button>
            <Button variant="outline" className="flex-1 gap-1.5" onClick={handleExportPDF}>
              <Download className="h-4 w-4 text-red-500" />
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Top ranking */}
      <div className="grid grid-cols-1 gap-3">
        <Card className="card-shadow-lg bg-white border-gray-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Customer Teratas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {topCustomers.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Belum ada data di periode ini
              </p>
            )}
            {topCustomers.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3">
                <span
                  className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                    i === 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-muted-foreground"
                  )}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">{c.count} order</p>
                </div>
                <p className="text-sm font-semibold text-green-600">{formatRupiah(c.profit)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="card-shadow-lg bg-white border-gray-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-violet-500" />
              Kain Terbanyak Dipakai
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {topFabrics.map((f, i) => (
              <div key={f.name} className="flex items-center gap-3">
                <span
                  className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                    i === 0 ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-muted-foreground"
                  )}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                  <p className="text-[11px] text-muted-foreground">Total pemakaian</p>
                </div>
                <p className="text-sm font-semibold text-violet-700">
                  {f.kg.toLocaleString("id-ID")} kg
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}