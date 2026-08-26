"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Wallet,
  TrendingUp,
  Percent,
  ShoppingCart,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
} from "lucide-react";
import { type Order, type MonthlySummary } from "@/lib/api";
import { formatRupiah, formatDate, cn } from "@/lib/utils";
import { Sparkline } from "@/components/reports/sparkline";
import { ProfitTrendChart } from "@/components/reports/profit-trend-chart";

type SortKey = "orderDate" | "customerName" | "qtyItems" | "omzet" | "hpp" | "profit" | "margin";

function SortHeader({
  label,
  k,
  sortKey,
  sortDir,
  onToggle,
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onToggle: (k: SortKey) => void;
}) {
  return (
    <th
      className="py-2 pr-3 font-semibold text-muted-foreground cursor-pointer select-none whitespace-nowrap"
      onClick={() => onToggle(k)}
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
}

interface Range {
  start: string;
  end: string;
}

export function KeuanganView({
  orders,
  summaries,
  range,
  prevRange,
  statusFilter = "all",
}: {
  orders: Order[];
  summaries: MonthlySummary[];
  range: Range;
  prevRange: Range;
  statusFilter?: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("orderDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const currOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.orderDate.slice(0, 10) >= range.start &&
          o.orderDate.slice(0, 10) <= range.end &&
          (statusFilter === "all" || o.status === statusFilter)
      ),
    [orders, range, statusFilter]
  );
  const prevOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.orderDate.slice(0, 10) >= prevRange.start &&
          o.orderDate.slice(0, 10) <= prevRange.end &&
          (statusFilter === "all" || o.status === statusFilter)
      ),
    [orders, prevRange, statusFilter]
  );

  const computeSummary = (list: Order[]) => {
    let revenue = 0, hpp = 0, profit = 0, counted = 0;
    for (const o of list) {
      const c = o.costing;
      if (!c) continue;
      revenue += c.sellingPrice;
      hpp += c.hpp;
      profit += c.profit;
      counted++;
    }
    return { revenue, hpp, profit, counted, margin: revenue > 0 ? (profit / revenue) * 100 : 0 };
  };

  const summary = useMemo(() => computeSummary(currOrders), [currOrders]);
  const prevSummary = useMemo(() => computeSummary(prevOrders), [prevOrders]);
  const pctChange = (curr: number, prev: number) => (prev > 0 ? ((curr - prev) / prev) * 100 : null);

  const sortedOrders = useMemo(() => {
    const rows = currOrders.map((o) => {
      const c = o.costing;
      return { order: o, omzet: c?.sellingPrice ?? null, hpp: c?.hpp ?? null, profit: c?.profit ?? null, margin: c?.profitMargin ?? null };
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
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const handleExportCSV = () => {
    const header = ["Tanggal", "No Order", "Customer", "Qty", "Omzet", "Material", "Upah", "HPP", "Ongkir", "Profit", "Margin %", "Status"];
    const rows = currOrders.map((o) => {
      const c = o.costing;
      return [o.orderDate, o.orderNumber, o.customerName, o.qtyItems, c?.sellingPrice ?? "", c?.materialCost ?? "", c?.laborCost ?? "", c?.hpp ?? "", c?.shippingCost ?? "", c?.profit ?? "", c?.profitMargin?.toFixed(1) ?? "", o.status];
    });
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-keuangan-${range.start}-${range.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const spark = {
    revenue: summaries.map((s) => s.totalRevenue),
    hpp: summaries.map((s) => s.totalHpp),
    profit: summaries.map((s) => s.totalProfit),
    margin: summaries.map((s) => s.avgMargin),
  };

  const kpis = [
    { icon: DollarSign, label: "Omzet", value: summary.revenue, prev: prevSummary.revenue, color: "border-blue-200 bg-blue-100", iconColor: "text-blue-700", valueColor: "text-blue-700", spark: spark.revenue, sparkColor: "#2563eb" },
    { icon: Wallet, label: "HPP", value: summary.hpp, prev: prevSummary.hpp, color: "border-orange-200 bg-orange-100", iconColor: "text-orange-700", valueColor: "text-orange-700", spark: spark.hpp, sparkColor: "#f59e0b" },
    { icon: TrendingUp, label: "Profit", value: summary.profit, prev: prevSummary.profit, color: "border-green-200 bg-green-100", iconColor: "text-green-700", valueColor: "text-green-700", spark: spark.profit, sparkColor: "#16a34a" },
    { icon: Percent, label: "Margin", value: summary.margin, prev: prevSummary.margin, isPercent: true, color: "border-violet-200 bg-violet-100", iconColor: "text-violet-700", valueColor: "text-violet-700", spark: spark.margin, sparkColor: "#7c3aed" },
  ];

  return (
    <div className="space-y-4">
      {/* KPI cards dengan sparkline */}
      <div className="grid grid-cols-2 gap-3">
        {kpis.map((s) => {
          const Icon = s.icon;
          const change = "isPercent" in s && s.isPercent ? null : pctChange(s.value, s.prev as number);
          return (
            <Card key={s.label} className={`border card-shadow-lg ${s.color}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className={`h-4 w-4 ${s.iconColor}`} />
                    <p className={`text-xs font-medium ${s.iconColor}`}>{s.label}</p>
                  </div>
                  <Sparkline data={s.spark} color={s.sparkColor} />
                </div>
                <p className={`text-lg font-bold truncate ${s.valueColor}`}>
                  {"isPercent" in s && s.isPercent ? `${s.value.toFixed(1)}%` : formatRupiah(s.value)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {change === null ? "Periode baru" : `${change >= 0 ? "↑" : "↓"} ${Math.abs(change as number).toFixed(1)}% vs lalu`}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tren Profit & Margin */}
      <Card className="card-shadow-lg bg-white border-gray-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tren Profit & Margin (6 bulan)</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfitTrendChart data={summaries} />
        </CardContent>
      </Card>

      {/* Tabel detail */}
      <Card className="card-shadow-lg bg-white border-gray-300">
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
                  <SortHeader label="Tanggal" k="orderDate" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                  <th className="py-2 pr-3 font-semibold text-muted-foreground">No. Order</th>
                  <SortHeader label="Customer" k="customerName" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                  <SortHeader label="Qty" k="qtyItems" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                  <SortHeader label="Omzet" k="omzet" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                  <SortHeader label="HPP" k="hpp" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                  <SortHeader label="Profit" k="profit" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                  <SortHeader label="Margin" k="margin" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                  <th className="py-2 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.map(({ order, omzet, hpp, profit, margin }) => {
                  const status = ({ draft: "bg-gray-100 text-gray-700", in_production: "bg-blue-100 text-blue-700", qc: "bg-amber-100 text-amber-700", shipped: "bg-green-100 text-green-700" } as Record<string, string>)[order.status] || "bg-gray-100 text-gray-700";
                  const isRugi = (profit ?? 0) < 0;
                  return (
                    <tr key={order.id} className={cn("border-b border-gray-100 last:border-0", isRugi && "bg-red-50")}>
                      <td className="py-2.5 pr-3 text-muted-foreground whitespace-nowrap">{formatDate(order.orderDate)}</td>
                      <td className="py-2.5 pr-3 font-semibold text-foreground whitespace-nowrap">{order.orderNumber}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground max-w-[110px] truncate">{order.customerName}</td>
                      <td className="py-2.5 pr-3 text-right">{order.qtyItems}</td>
                      <td className="py-2.5 pr-3 text-right font-medium whitespace-nowrap">{omzet !== null ? formatRupiah(omzet) : "-"}</td>
                      <td className="py-2.5 pr-3 text-right whitespace-nowrap">{hpp !== null ? formatRupiah(hpp) : "-"}</td>
                      <td className={cn("py-2.5 pr-3 text-right font-semibold whitespace-nowrap", profit === null ? "text-muted-foreground" : profit >= 0 ? "text-green-600" : "text-red-600")}>
                        {profit !== null ? formatRupiah(profit) : "-"}
                      </td>
                      <td className="py-2.5 pr-3 text-right whitespace-nowrap">{margin !== null ? `${margin.toFixed(1)}%` : "-"}</td>
                      <td className="py-2.5 whitespace-nowrap">
                        <span className={cn("text-[10px] px-1.5 py-0 rounded-full", status)}>{order.status}</span>
                      </td>
                    </tr>
                  );
                })}
                {sortedOrders.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">Tidak ada order dalam rentang tanggal ini</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
            <Button variant="outline" className="flex-1 gap-1.5" onClick={handleExportCSV}>
              <FileSpreadsheet className="h-4 w-4 text-green-600" /> Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
