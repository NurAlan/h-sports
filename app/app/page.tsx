"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { MenuGuide } from "@/components/tutorial/menu-guide";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, ClipboardList, AlertTriangle, ChevronRight } from "lucide-react";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { StockDonut } from "@/components/dashboard/stock-donut";
import { DashboardSkeleton } from "@/components/skeletons";
import { api, type DashboardData } from "@/lib/api";
import { formatRupiah, formatDate, daysUntil, daysLeftLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-200 text-gray-700" },
  in_production: { label: "Produksi", className: "bg-blue-100 text-blue-700" },
  qc: { label: "QC", className: "bg-amber-100 text-amber-700" },
  shipped: { label: "Selesai", className: "bg-green-100 text-green-700" },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DashboardData>("/api/dashboard")
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const latest = data?.summaries?.[data.summaries.length - 1];
  const prev = data?.summaries?.[data.summaries.length - 2];
  const profitTrend =
    latest && prev && prev.totalProfit > 0
      ? ((latest.totalProfit - prev.totalProfit) / prev.totalProfit) * 100
      : null;

  const donutData =
    data?.lowStock.length || data?.totalStock
      ? [
          // Simulasi dari lowStock — komposisi detail akan dari /api/inventory
        ]
      : [];

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <PageHeader
        title="Dashboard"
        subtitle="Ringkasan bisnis bulan ini"
        action={<MenuGuide menuKey="dashboard" />}
      />

      {loading && <DashboardSkeleton />}

      {error && !loading && (
        <Card className="bg-red-50 border-red-300 card-shadow-lg">
          <CardContent className="py-6 text-center">
            <p className="text-sm font-semibold text-red-700 mb-1">
              Gagal memuat data
            </p>
            <p className="text-xs text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && data && (
        <>
          {/* Hero Card — Profit */}
          <Card className="mb-4 card-shadow-lg bg-gradient-to-br from-blue-600 to-blue-800 border-blue-300 text-white">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-4 w-4 text-blue-200" />
                <p className="text-xs font-medium text-blue-200">
                  Profit {latest?.month?.slice(5)}/{latest?.month?.slice(0, 4) || "-"}
                </p>
              </div>
              <p className="text-3xl font-bold mb-2">
                {formatRupiah(latest?.totalProfit ?? 0)}
              </p>
              <div className="flex items-center gap-3 text-xs text-blue-200">
                <span className="bg-white/15 rounded-full px-2 py-0.5">
                  {profitTrend === null
                    ? "Periode baru"
                    : `${profitTrend >= 0 ? "↑" : "↓"} ${Math.abs(profitTrend).toFixed(1)}% vs lalu`}
                </span>
                <span>Margin: {latest?.avgMargin?.toFixed(1) ?? 0}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Grafik Omzet vs Profit */}
          <Card className="mb-4 card-shadow-lg bg-white border-gray-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Omzet vs Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={data.summaries} />
            </CardContent>
          </Card>

          {/* Stat compact */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card className="border-blue-200 bg-blue-100 card-shadow-lg">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <Package className="h-4 w-4 text-blue-700" />
                  <p className="text-xs font-medium text-blue-800">Stok Kain</p>
                </div>
                <p className="text-lg font-bold text-blue-700">
                  {data.totalStock.toLocaleString("id-ID")} kg
                </p>
                <p className="text-[11px] text-blue-600">
                  {data.lowStock.length} jenis menipis
                </p>
              </CardContent>
            </Card>
            <Card className="border-violet-200 bg-violet-100 card-shadow-lg">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <ClipboardList className="h-4 w-4 text-violet-700" />
                  <p className="text-xs font-medium text-violet-800">Order Aktif</p>
                </div>
                <p className="text-lg font-bold text-violet-700">
                  {data.activeOrders.length}
                </p>
                <p className="text-[11px] text-violet-600">Belum selesai</p>
              </CardContent>
            </Card>
          </div>

          {/* Order Mendekati Deadline */}
          <Card className="mb-4 card-shadow-lg bg-white border-gray-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Order Mendekati Deadline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {data.activeOrders.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">
                  Tidak ada order aktif
                </p>
              )}
              {data.activeOrders.map((order) => {
                const days = order.deadline ? daysUntil(order.deadline) : null;
                const status = statusConfig[order.status] || statusConfig.draft;
                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {order.customerName}
                      </p>
                    </div>
                    <Badge variant="secondary" className={`text-[10px] ${status.className}`}>
                      {status.label}
                    </Badge>
                    {order.deadline && (
                      <span
                        className={cn(
                          "text-[11px] font-semibold whitespace-nowrap",
                          (days ?? 99) < 0
                            ? "text-red-700"
                            : (days ?? 99) <= 1
                              ? "text-red-500"
                              : (days ?? 99) < 3
                                ? "text-orange-500"
                                : "text-muted-foreground"
                        )}
                      >
                        {days !== null ? daysLeftLabel(days) : ""}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {/* Stok Menipis */}
          {data.lowStock.length > 0 && (
            <Card className="border-red-300 bg-red-100 card-shadow-lg border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Stok Menipis!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.lowStock.map((f) => (
                  <Link
                    key={f.id}
                    href={`/inventory/${f.id}`}
                    className="flex items-center justify-between rounded-lg bg-white border border-red-200 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {f.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Reorder point: {f.reorderPoint} kg
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-red-600">
                        {f.stock.toLocaleString("id-ID")} kg
                      </p>
                      <p className="text-[10px] text-red-500 font-medium">
                        ⚠️ Segera beli
                      </p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
