import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Clock,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { StockDonut } from "@/components/dashboard/stock-donut";
import {
  orders,
  fabrics,
  monthlyStats,
  getFabricStock,
} from "@/lib/mock-data";
import { formatRupiah, daysUntil, daysLeftLabel } from "@/lib/utils";

export default function DashboardPage() {
  // ===== Data perhitungan =====
  const latest = monthlyStats[monthlyStats.length - 1]; // Agustus
  const prev = monthlyStats[monthlyStats.length - 2]; // Juli
  const profitChange =
    prev.profit > 0 ? ((latest.profit - prev.profit) / prev.profit) * 100 : 0;
  const margin = latest.revenue > 0 ? (latest.profit / latest.revenue) * 100 : 0;

  const totalStock = fabrics.reduce((s, f) => s + getFabricStock(f.id), 0);
  const activeOrders = orders.filter(
    (o) => o.status === "in_production" || o.status === "qc"
  );
  const upcomingDeadlines = orders
    .filter((o) => o.status !== "shipped" && o.status !== "cancelled")
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
  const lowStockFabrics = fabrics
    .map((f) => ({ ...f, stock: getFabricStock(f.id) }))
    .filter((f) => f.stock <= f.reorderPoint);

  const isProfitUp = profitChange >= 0;

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <PageHeader
        title="Dashboard"
        subtitle="Ringkasan bisnis bulan ini"
      />

      {/* 1. Hero Card — Profit */}
      <Card className="mb-4 border-blue-300 bg-gradient-to-br from-blue-500 to-blue-700 card-shadow-lg border">
        <CardContent className="pt-5 pb-5">
          <p className="text-xs font-medium text-blue-100 mb-1">
            Profit Bulan {latest.month}
          </p>
          <p className="text-3xl font-bold text-white mb-2">
            {formatRupiah(latest.profit)}
          </p>
          <div className="flex items-center gap-3 text-[11px] text-blue-100 mb-3">
            <span className="flex items-center gap-1">
              {isProfitUp ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {isProfitUp ? "+" : ""}
              {profitChange.toFixed(1)}% vs {prev.month}
            </span>
            <span>Margin {margin.toFixed(1)}%</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/20">
            <div>
              <p className="text-[10px] text-blue-100">Omzet</p>
              <p className="text-sm font-semibold text-white">
                {formatRupiah(latest.revenue)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-blue-100">HPP</p>
              <p className="text-sm font-semibold text-white">
                {formatRupiah(latest.hpp)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Grafik Omzet vs Profit */}
      <Card className="mb-4 card-shadow-lg bg-white border-gray-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Omzet vs Profit</span>
            <span className="text-[11px] font-normal text-muted-foreground">
              6 bulan terakhir
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart />
        </CardContent>
      </Card>

      {/* 3. Stat compact */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="border-blue-200 bg-blue-100 card-shadow-lg border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Package className="h-4 w-4 text-blue-700" />
              <p className="text-xs font-medium text-blue-800">Stok Kain</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {totalStock.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-blue-600">kg • {fabrics.length} jenis</p>
          </CardContent>
        </Card>
        <Card className="border-violet-200 bg-violet-100 card-shadow-lg border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-4 w-4 text-violet-700" />
              <p className="text-xs font-medium text-violet-800">Order Aktif</p>
            </div>
            <p className="text-2xl font-bold text-violet-700">
              {activeOrders.length}
            </p>
            <p className="text-[11px] text-violet-600">
              {activeOrders.filter((o) => o.status === "qc").length} di QC
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 4. Komposisi stok */}
      <Card className="mb-4 card-shadow-lg bg-white border-gray-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Komposisi Stok Kain</CardTitle>
        </CardHeader>
        <CardContent>
          <StockDonut />
        </CardContent>
      </Card>

      {/* 5. Order mendekati deadline */}
      <Card className="mb-4 card-shadow-lg bg-white border-gray-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Order Mendekati Deadline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingDeadlines.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-3">
              Tidak ada order aktif
            </p>
          )}
          {upcomingDeadlines.map((order) => {
            const days = daysUntil(order.deadline);
            let badgeClass = "bg-blue-100 text-blue-700";
            if (days < 0) badgeClass = "bg-red-200 text-red-800";
            else if (days <= 1) badgeClass = "bg-amber-100 text-amber-800";
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between gap-2 pb-3 border-b border-border/60 last:border-0 last:pb-0 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {order.orderNumber}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {order.customerName} • {order.qtyItems} pcs • {order.stage}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Badge variant="secondary" className={badgeClass}>
                    {daysLeftLabel(days)}
                  </Badge>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {/* 6. Stok menipis */}
      {lowStockFabrics.length > 0 && (
        <Card className="border-red-300 bg-red-100 card-shadow-lg border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Stok Menipis!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStockFabrics.map((fabric) => (
              <Link
                key={fabric.id}
                href={`/inventory/${fabric.id}`}
                className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200 hover:border-red-300 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-red-900">
                    {fabric.name}
                  </p>
                  <p className="text-xs text-red-500">
                    Reorder point: {fabric.reorderPoint} {fabric.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">
                    {fabric.stock.toLocaleString("id-ID")} {fabric.unit}
                  </p>
                  <p className="text-xs font-medium text-red-500">
                    ⚠️ Segera beli
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
