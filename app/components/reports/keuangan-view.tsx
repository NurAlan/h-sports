"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Wallet,
  TrendingUp,
  Percent,
  Receipt,
  FileSpreadsheet,
} from "lucide-react";
import { type Order, type MonthlySummary } from "@/lib/api";
import { formatRupiah, formatDate, cn } from "@/lib/utils";
import { ORDER_STATUS } from "@/lib/status-config";
import { Sparkline } from "@/components/reports/sparkline";
import { ProfitTrendChart } from "@/components/reports/profit-trend-chart";

const PAGE_SIZE = 10;

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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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

  // Orders sorted by date desc — newest first
  const sortedOrders = useMemo(() => {
    return [...currOrders]
      .sort((a, b) => b.orderDate.localeCompare(a.orderDate))
      .map((o) => ({
        order: o,
        omzet: o.costing?.sellingPrice ?? null,
        profit: o.costing?.profit ?? null,
      }));
  }, [currOrders]);

  const handleExportCSV = () => {
    const header = ["Tanggal", "No Order", "Customer", "Omzet"];
    const rows = sortedOrders.map(({ order, omzet }) => [
      order.orderDate,
      order.orderNumber,
      order.customerName,
      omzet ?? "",
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pendapatan-${range.start}-${range.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const visibleOrders = sortedOrders.slice(0, visibleCount);
  const hasMore = visibleCount < sortedOrders.length;

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
                    <p className={`text-sm font-medium ${s.iconColor}`}>{s.label}</p>
                  </div>
                  <Sparkline data={s.spark} color={s.sparkColor} />
                </div>
                <p className={`text-xl font-bold truncate ${s.valueColor}`}>
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
          <CardTitle className="text-lg">Tren Profit & Margin (6 bulan)</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfitTrendChart data={summaries} />
        </CardContent>
      </Card>

      {/* Riwayat Pendapatan */}
      <Card className="card-shadow-lg bg-white border-gray-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            Riwayat Pendapatan
            <span className="text-[11px] font-normal text-muted-foreground">
              {sortedOrders.length} transaksi
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedOrders.length === 0 ? (
            <div className="py-8 text-center">
              <Receipt className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Tidak ada transaksi dalam rentang tanggal ini</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleOrders.map(({ order, omzet, profit }) => {
                const statusCfg = ORDER_STATUS[order.status] ?? ORDER_STATUS.draft;
                const isRugi = (profit ?? 0) < 0;
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-base font-semibold text-foreground truncate">
                          {order.orderNumber}
                        </span>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0", statusCfg.className)}>
                          {statusCfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatDate(order.orderDate)}</span>
                        <span>•</span>
                        <span className="truncate">{order.customerName}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-foreground tabular-nums">
                        {omzet !== null ? formatRupiah(omzet) : "—"}
                      </p>
                      {profit !== null && (
                        <p className={cn("text-sm tabular-nums font-medium", isRugi ? "text-red-600" : "text-green-600")}>
                          {isRugi ? "" : "+"}{formatRupiah(profit)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="mt-3 pt-3 border-t border-gray-100">
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
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
            <Button variant="outline" className="flex-1 gap-1.5" onClick={handleExportCSV}>
              <FileSpreadsheet className="h-4 w-4 text-green-600" /> Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
