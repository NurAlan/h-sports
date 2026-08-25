import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { orders, fabrics, getFabricStock } from "@/lib/mock-data";
import { formatRupiah, daysUntil, daysLeftLabel } from "@/lib/utils";

// Stats compact
const stats = [
  {
    title: "Stok Kain",
    value: "127 kg",
    subtitle: "4 jenis kain",
    icon: Package,
    valueClass: "text-blue-700",
    cardClass: "bg-blue-100 border-blue-300",
    iconClass: "bg-blue-500 text-white",
  },
  {
    title: "Profit",
    value: "Rp 8,45jt",
    subtitle: "Margin 23.5%",
    icon: TrendingUp,
    valueClass: "text-green-700",
    cardClass: "bg-green-100 border-green-300",
    iconClass: "bg-green-500 text-white",
  },
  {
    title: "Order Aktif",
    value: "7",
    subtitle: "2 di QC",
    icon: Clock,
    valueClass: "text-violet-700",
    cardClass: "bg-violet-100 border-violet-300",
    iconClass: "bg-violet-500 text-white",
  },
];

// Order yang belum selesai, diurutkan deadline terdekat
const upcomingDeadlines = orders
  .filter((o) => o.status !== "shipped" && o.status !== "cancelled")
  .sort((a, b) => a.deadline.localeCompare(b.deadline));

// Stok menipis (di bawah reorder point)
const lowStockFabrics = fabrics
  .map((f) => ({ ...f, stock: getFabricStock(f.id) }))
  .filter((f) => f.stock <= f.reorderPoint);

function getDeadlineBadge(days: number) {
  let className = "bg-blue-100 text-blue-700";
  if (days <= 0) className = "bg-red-200 text-red-800";
  else if (days <= 2) className = "bg-amber-100 text-amber-800";
  return (
    <Badge variant="secondary" className={className}>
      {daysLeftLabel(days)}
    </Badge>
  );
}

export default function DashboardPage() {
  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <PageHeader
        title="Dashboard"
        subtitle="Overview bisnis hari ini"
      />

      {/* Stat cards compact — 3 kolom */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className={`border card-shadow-lg p-3 ${stat.cardClass}`}
            >
              <CardContent className="p-0">
                <div
                  className={`${stat.iconClass} w-7 h-7 rounded-lg flex items-center justify-center mb-2 shadow-sm`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <p className={`text-base font-bold leading-tight truncate ${stat.valueClass}`}>
                  {stat.value}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground mt-0.5 truncate">
                  {stat.title}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {stat.subtitle}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Order mendekati deadline */}
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
                  {getDeadlineBadge(days)}
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {/* Stok menipis — merah */}
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
