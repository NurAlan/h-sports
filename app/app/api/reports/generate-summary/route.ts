import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

/**
 * POST /api/reports/generate-summary
 * 
 * Worker untuk generate monthly summary dari historical orders.
 * Agregasi revenue, HPP, profit per bulan dari order shipped dengan costing.
 */
export async function POST() {
  const { error } = await requireUser();
  if (error) return error;

  try {
    // Fetch semua order shipped yang punya costing
    const orders = await prisma.order.findMany({
      where: {
        status: "shipped",
        costing: { isNot: null },
      },
      include: {
        costing: true,
      },
      orderBy: {
        orderDate: "asc",
      },
    });

    // Group by month (YYYY-MM)
    const monthlyData = new Map<
      string,
      { revenue: number; hpp: number; profit: number; count: number }
    >();

    for (const order of orders) {
      if (!order.costing) continue;

      // Convert Date to YYYY-MM string
      const orderDateStr = order.orderDate.toISOString().slice(0, 10);
      const month = orderDateStr.slice(0, 7); // "YYYY-MM"
      const existing = monthlyData.get(month) || {
        revenue: 0,
        hpp: 0,
        profit: 0,
        count: 0,
      };

      existing.revenue += order.costing.sellingPrice;
      existing.hpp += order.costing.hpp;
      existing.profit += order.costing.profit;
      existing.count++;

      monthlyData.set(month, existing);
    }

    // Upsert ke MonthlySummary
    let created = 0;
    let updated = 0;

    for (const [month, data] of monthlyData.entries()) {
      const avgMargin = data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0;

      const result = await prisma.monthlySummary.upsert({
        where: { month },
        create: {
          month,
          totalRevenue: Math.round(data.revenue),
          totalHpp: Math.round(data.hpp),
          totalProfit: Math.round(data.profit),
          avgMargin: Math.round(avgMargin * 100) / 100, // 2 decimal places
          totalOrders: data.count,
        },
        update: {
          totalRevenue: Math.round(data.revenue),
          totalHpp: Math.round(data.hpp),
          totalProfit: Math.round(data.profit),
          avgMargin: Math.round(avgMargin * 100) / 100,
          totalOrders: data.count,
        },
      });

      // Check if created or updated (Prisma doesn't return this info directly)
      // We'll assume it's an update if the record existed
      const wasExisting = await prisma.monthlySummary.findUnique({
        where: { month },
      });
      
      if (wasExisting) {
        updated++;
      } else {
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Summary generated successfully`,
      stats: {
        monthsProcessed: monthlyData.size,
        created,
        updated,
        ordersProcessed: orders.length,
      },
    });
  } catch (err) {
    console.error("[generate-summary] Error:", err);
    return NextResponse.json(
      { error: `Failed to generate summary: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
