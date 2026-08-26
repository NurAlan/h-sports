import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

/** GET /api/dashboard — summary untuk dashboard
 * Menghitung langsung dari tabel orders + costing (bukan monthly_summaries)
 * supaya data selalu real-time tanpa perlu cron job.
 */
export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  // ── 1. Hitung profit/revenue bulan ini dari orders shipped ──────────────
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    thisMonthOrders,
    lastMonthOrders,
    allShippedOrders,
    stockAgg,
    lowStockFabrics,
    activeOrders,
  ] = await Promise.all([
    // Order shipped bulan ini
    prisma.order.findMany({
      where: { status: "shipped", orderDate: { gte: startOfMonth } },
      include: { costing: true },
    }),
    // Order shipped bulan lalu
    prisma.order.findMany({
      where: {
        status: "shipped",
        orderDate: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      include: { costing: true },
    }),
    // Semua order shipped (untuk chart 6 bulan)
    prisma.order.findMany({
      where: {
        status: "shipped",
        orderDate: {
          gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
        },
      },
      include: { costing: true },
      orderBy: { orderDate: "asc" },
    }),
    // Stok total
    prisma.fabricBatch.aggregate({
      _sum: { qtyRemaining: true },
    }),
    // Low stock fabrics
    prisma.fabric.findMany({
      where: { isActive: true, colors: { some: { batches: { some: {} } } } },
      include: {
        colors: {
          include: {
            batches: { select: { qtyRemaining: true } },
          },
        },
      },
    }),
    // Order aktif (deadline terdekat)
    prisma.order.findMany({
      where: { status: { in: ["draft", "in_production", "qc"] } },
      orderBy: { deadline: "asc" },
      take: 5,
      select: { id: true, orderNumber: true, customerName: true, status: true, deadline: true },
    }),
  ]);

  const calcSummary = (orders: typeof thisMonthOrders) => {
    let revenue = 0, hpp = 0, profit = 0;
    for (const o of orders) {
      if (o.costing) {
        revenue += o.costing.sellingPrice;
        hpp += o.costing.hpp;
        profit += o.costing.profit;
      }
    }
    return {
      revenue: Math.round(revenue),
      hpp: Math.round(hpp),
      profit: Math.round(profit),
      margin: revenue > 0 ? Math.round((profit / revenue) * 100 * 10) / 10 : 0,
      orderCount: orders.length,
    };
  };

  const thisMonth = calcSummary(thisMonthOrders);
  const lastMonth = calcSummary(lastMonthOrders);

  // ── 2. Build monthly summaries dari data real (6 bulan terakhir) ─────────
  const monthlyMap: Record<string, { revenue: number; hpp: number; profit: number; count: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] = { revenue: 0, hpp: 0, profit: 0, count: 0 };
  }

  for (const o of allShippedOrders) {
    if (!o.costing) continue;
    const d = new Date(o.orderDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap[key]) {
      monthlyMap[key].revenue += o.costing.sellingPrice;
      monthlyMap[key].hpp += o.costing.hpp;
      monthlyMap[key].profit += o.costing.profit;
      monthlyMap[key].count++;
    }
  }

  const summaries = Object.entries(monthlyMap).map(([month, v]) => ({
    month,
    totalRevenue: Math.round(v.revenue),
    totalHpp: Math.round(v.hpp),
    totalProfit: Math.round(v.profit),
    totalOrders: v.count,
    avgMargin: v.revenue > 0 ? Math.round((v.profit / v.revenue) * 100 * 10) / 10 : 0,
  }));

  // ── 3. Stok total ────────────────────────────────────────────────────────
  const totalStock = stockAgg._sum.qtyRemaining ?? 0;

  // ── 4. Low stock fabrics ─────────────────────────────────────────────────
  const lowStock = lowStockFabrics
    .map((f) => {
      const stock = f.colors.reduce(
        (s, c) => s + c.batches.reduce((bs, b) => bs + b.qtyRemaining, 0),
        0
      );
      return { id: f.id, name: f.name, stock, reorderPoint: f.reorderPoint };
    })
    .filter((f) => f.stock > 0 && f.stock <= f.reorderPoint);

  return NextResponse.json(
    {
      summaries,
      thisMonth,
      lastMonth,
      totalStock: Math.round(totalStock * 10) / 10,
      lowStock,
      activeOrders,
    },
    { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=300" } }
  );
}
