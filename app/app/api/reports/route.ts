import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

/** GET /api/reports — data laporan */
export async function GET(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");

  // Filter orders by date range
  const where: Record<string, unknown> = {};
  if (startDate || endDate) {
    where.orderDate = {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lte: new Date(endDate) } : {}),
    };
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { orderDate: "desc" },
    include: { costing: true },
  });

  // Summary
  let revenue = 0;
  let hpp = 0;
  let profit = 0;
  let counted = 0;
  for (const o of orders) {
    if (o.costing) {
      revenue += o.costing.sellingPrice;
      hpp += o.costing.hpp;
      profit += o.costing.profit;
      counted++;
    }
  }
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  // Monthly summaries (untuk chart)
  const summaries = await prisma.monthlySummary.findMany({
    orderBy: { month: "asc" },
    take: 6,
  });

  return NextResponse.json({
    summary: { revenue: Math.round(revenue), hpp: Math.round(hpp), profit: Math.round(profit), margin, counted },
    orders,
    summaries,
  });
}