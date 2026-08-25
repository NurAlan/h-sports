import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart } from "lucide-react";

// Dummy data
const summary = {
  period: "Agustus 2026",
  totalOrders: 12,
  totalRevenue: 18450000,
  totalHPP: 14120000,
  grossProfit: 4330000,
  profitMargin: 23.5,
};

const monthlyData = [
  { month: "Mei", revenue: 15200000, profit: 3420000, margin: 22.5 },
  { month: "Juni", revenue: 16800000, profit: 3780000, margin: 22.5 },
  { month: "Juli", revenue: 17500000, profit: 4025000, margin: 23.0 },
  { month: "Agustus", revenue: 18450000, profit: 4330000, margin: 23.5 },
];

const topFabrics = [
  { name: "Cotton Combed 30s", usage: 125.5, unit: "kg", cost: 6526000 },
  { name: "Polyester PE", usage: 45.2, unit: "kg", cost: 2034000 },
  { name: "Cotton Combed 24s", usage: 38.0, unit: "kg", cost: 2204000 },
];

export default function ReportsPage() {
  const revenueChange = ((summary.totalRevenue - monthlyData[2].revenue) / monthlyData[2].revenue) * 100;
  
  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <PageHeader
        title="Reports"
        subtitle={`Laporan ${summary.period}`}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="border-gray-300 bg-white card-shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xs text-muted-foreground">Total Order</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{summary.totalOrders}</p>
          </CardContent>
        </Card>

        <Card className="border-gray-300 bg-white card-shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-xs text-muted-foreground">Omzet</p>
            </div>
            <p className="text-lg font-bold text-foreground">
              Rp {(summary.totalRevenue / 1000000).toFixed(1)}jt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profit Card */}
      <Card className="mb-6 border-border bg-gradient-to-br from-primary/5 to-primary/10 card-shadow-lg">
        <CardHeader>
          <CardTitle className="text-base">Gross Profit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-3xl font-bold text-primary">
              Rp {(summary.grossProfit / 1000000).toFixed(2)}jt
            </p>
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">
                +{revenueChange.toFixed(1)}%
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Margin: {summary.profitMargin.toFixed(1)}%
          </p>
          
          <div className="space-y-2 pt-4 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">HPP</span>
              <span className="font-medium">
                Rp {(summary.totalHPP / 1000000).toFixed(2)}jt
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Revenue</span>
              <span className="font-medium">
                Rp {(summary.totalRevenue / 1000000).toFixed(2)}jt
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card className="mb-6 card-shadow-lg bg-white border-gray-300">
        <CardHeader>
          <CardTitle className="text-base">Trend 4 Bulan Terakhir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {monthlyData.map((data) => (
            <div
              key={data.month}
              className="flex items-center justify-between pb-3 border-b border-border last:border-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{data.month}</p>
                <p className="text-xs text-muted-foreground">
                  Margin: {data.margin.toFixed(1)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">
                  Rp {(data.profit / 1000000).toFixed(2)}jt
                </p>
                <p className="text-xs text-muted-foreground">
                  dari Rp {(data.revenue / 1000000).toFixed(1)}jt
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Top Fabrics Usage */}
      <Card className="card-shadow-lg bg-white border-gray-300">
        <CardHeader>
          <CardTitle className="text-base">Pemakaian Kain Tertinggi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topFabrics.map((fabric) => (
            <div
              key={fabric.name}
              className="flex items-center justify-between pb-3 border-b border-border last:border-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{fabric.name}</p>
                <p className="text-xs text-muted-foreground">
                  {fabric.usage} {fabric.unit}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">
                  Rp {(fabric.cost / 1000000).toFixed(2)}jt
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
