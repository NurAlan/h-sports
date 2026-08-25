import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, AlertTriangle, Clock } from "lucide-react";

// Dummy data untuk dashboard
const stats = [
  {
    title: "Stok Kain",
    value: "127.5 kg",
    subtitle: "Total tersedia",
    icon: Package,
    trend: "+12.3 kg minggu ini",
    trendPositive: true,
    // Blue accent
    cardClass: "bg-blue-100 border-blue-300",
    iconClass: "bg-blue-500 text-white",
    valueClass: "text-blue-700",
  },
  {
    title: "Profit Bulan Ini",
    value: "Rp 8,450,000",
    subtitle: "Margin 23.5%",
    icon: TrendingUp,
    trend: "+15.2% vs bulan lalu",
    trendPositive: true,
    // Green accent
    cardClass: "bg-green-100 border-green-300",
    iconClass: "bg-green-500 text-white",
    valueClass: "text-green-700",
  },
  {
    title: "Order Aktif",
    value: "7 order",
    subtitle: "Dalam produksi",
    icon: Clock,
    trend: "2 di stage QC",
    trendPositive: false,
    // Purple accent
    cardClass: "bg-violet-100 border-violet-300",
    iconClass: "bg-violet-500 text-white",
    valueClass: "text-violet-700",
  },
];

const recentOrders = [
  {
    id: "ORD-20260825-001",
    customer: "Toko Baju Sejahtera",
    qty: 50,
    status: "in_production",
    stage: "Jahit",
    profit: "Rp 347,500",
  },
  {
    id: "ORD-20260824-003",
    customer: "PT Garmen Indo",
    qty: 100,
    status: "qc",
    stage: "QC",
    profit: "Rp 1,200,000",
  },
  {
    id: "ORD-20260823-002",
    customer: "CV Tekstil Makmur",
    qty: 75,
    status: "shipped",
    stage: "Terkirim",
    profit: "Rp 890,000",
  },
];

const lowStockFabrics = [
  { name: "Cotton Combed 30s", stock: 8.5, unit: "kg", reorder: 10 },
  { name: "Polyester PE", stock: 3.2, unit: "kg", reorder: 5 },
];

function getStatusBadge(status: string) {
  const variants: Record<string, { label: string; className: string }> = {
    in_production: { label: "Produksi", className: "bg-blue-100 text-blue-700" },
    qc: { label: "QC", className: "bg-yellow-100 text-yellow-700" },
    shipped: { label: "Terkirim", className: "bg-green-100 text-green-700" },
  };

  const config = variants[status] || { label: status, className: "" };

  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
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

      {/* Stats Cards — colored accents */}
      <div className="space-y-3 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className={`border card-shadow-lg ${stat.cardClass}`}
            >
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      {stat.title}
                    </p>
                    <p className={`text-2xl font-bold mb-1 ${stat.valueClass}`}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.subtitle}
                    </p>
                    <p
                      className={`text-xs mt-2 font-medium ${
                        stat.trendPositive
                          ? "text-green-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {stat.trend}
                    </p>
                  </div>
                  <div
                    className={`${stat.iconClass} p-3 rounded-xl shadow-md flex-shrink-0`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Orders */}
      <Card className="mb-6 card-shadow-lg bg-white border-gray-300">
        <CardHeader>
          <CardTitle className="text-base">Order Terbaru</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-start justify-between pb-3 border-b border-border last:border-0 last:pb-0"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-foreground">
                    {order.id}
                  </p>
                  {getStatusBadge(order.status)}
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {order.customer}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.qty} pcs • {order.stage}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-green-600">
                  {order.profit}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Low Stock Alert — RED untuk awareness */}
      {lowStockFabrics.length > 0 && (
        <Card className="border-red-300 bg-red-100 card-shadow-lg border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Stok Menipis!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStockFabrics.map((fabric) => (
              <div
                key={fabric.name}
                className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200"
              >
                <div>
                  <p className="text-sm font-semibold text-red-900">
                    {fabric.name}
                  </p>
                  <p className="text-xs text-red-500">
                    Reorder point: {fabric.reorder} {fabric.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">
                    {fabric.stock} {fabric.unit}
                  </p>
                  <p className="text-xs font-medium text-red-500">
                    ⚠️ Segera beli
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
