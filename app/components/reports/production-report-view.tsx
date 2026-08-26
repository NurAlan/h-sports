"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { api, type ProductionReportData, type ProductionReportOrder } from "@/lib/api";
import { formatRupiah, formatDate, profitColor, cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-700" },
  in_production: { label: "Produksi", className: "bg-blue-100 text-blue-700" },
  qc: { label: "QC", className: "bg-amber-100 text-amber-700" },
  shipped: { label: "Selesai", className: "bg-green-100 text-green-700" },
};

type SortKey = "orderDate" | "customerName" | "revenue" | "profit";

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
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

  const handleExportCSV = () => {
    const header = [
      "Tanggal", "No Order", "Customer", "Status", "Deadline",
      "Stage", "On-time", "Omzet", "HPP", "Profit", "Margin %",
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
      <Card className="card-shadow-lg bg-white border-gray-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-violet-500" />
            Kain Terbanyak Dipakai
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {topFabrics.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              Belum ada pemakaian kain di periode ini
            </p>
          ) : (
            topFabrics.map((f, i) => (
              <div key={f.fabricId} className="flex items-center gap-3">
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
                  <div className="h-1.5 rounded-full bg-gray-100 mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{ width: `${maxKg ? (f.kg / maxKg) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <p className="text-sm font-semibold text-violet-700 whitespace-nowrap">
                  {f.kg.toLocaleString("id-ID")} kg
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Tabel detail */}
      <Card className="card-shadow-lg bg-white border-gray-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Detail Order
            <span className="text-[11px] font-normal text-muted-foreground">
              {orders.length} order • klik header untuk sort
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-sm text-muted-foreground py-8">Memuat...</p>
          ) : (
            <>
              <div className="overflow-x-auto -mx-1 px-1">
                <table className="w-full text-left text-xs min-w-[820px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <SortHeader label="Tanggal" k="orderDate" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                      <th className="py-2 pr-3 font-semibold text-muted-foreground">No. Order</th>
                      <SortHeader label="Customer" k="customerName" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                      <th className="py-2 pr-3 font-semibold text-muted-foreground">Status</th>
                      <th className="py-2 pr-3 font-semibold text-muted-foreground">Deadline</th>
                      <th className="py-2 pr-3 font-semibold text-muted-foreground">Stage</th>
                      <th className="py-2 pr-3 font-semibold text-muted-foreground">On-time</th>
                      <SortHeader label="Omzet" k="revenue" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                      <SortHeader label="Profit" k="profit" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedOrders.map((o: ProductionReportOrder) => {
                      const status = statusConfig[o.status] || statusConfig.draft;
                      return (
                        <tr key={o.id} className="border-b border-gray-100 last:border-0">
                          <td className="py-2.5 pr-3 text-muted-foreground whitespace-nowrap">
                            {formatDate(o.orderDate)}
                          </td>
                          <td className="py-2.5 pr-3 font-semibold text-foreground whitespace-nowrap">
                            {o.orderNumber}
                          </td>
                          <td className="py-2.5 pr-3 text-muted-foreground max-w-[110px] truncate">
                            {o.customerName}
                          </td>
                          <td className="py-2.5 pr-3 whitespace-nowrap">
                            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${status.className}`}>
                              {status.label}
                            </Badge>
                          </td>
                          <td className="py-2.5 pr-3 text-muted-foreground whitespace-nowrap">
                            {o.deadline ? formatDate(o.deadline) : "-"}
                          </td>
                          <td className="py-2.5 pr-3 text-muted-foreground whitespace-nowrap">
                            {o.stagesCompleted}/{o.stagesTotal}
                          </td>
                          <td className="py-2.5 pr-3 whitespace-nowrap">
                            {o.onTime === null ? (
                              <span className="text-muted-foreground">-</span>
                            ) : o.onTime ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-red-500" />
                            )}
                          </td>
                          <td className="py-2.5 pr-3 text-right font-medium whitespace-nowrap">
                            {formatRupiah(o.revenue)}
                          </td>
                          <td
                            className={cn(
                              "py-2.5 pr-3 text-right font-semibold whitespace-nowrap",
                              profitColor(o.profit)
                            )}
                          >
                            {formatRupiah(o.profit)}
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

              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <Button variant="outline" className="flex-1 gap-1.5" onClick={handleExportCSV}>
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  Export Excel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
