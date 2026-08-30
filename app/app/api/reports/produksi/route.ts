import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

/** GET /api/reports/produksi — laporan produksi (real-time, filter date range) */
export async function GET(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (startDate || endDate) {
    where.orderDate = {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lte: new Date(endDate) } : {}),
    };
  }
  if (status && status !== "all") {
    where.status = status;
  }

  const [orders, bomItems] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { orderDate: "desc" },
      include: {
        costing: { include: { costItems: { select: { label: true, amount: true, keterangan: true } } } },
        timelines: true,
      },
    }),
    // Top kain terbanyak dipakai (agregat BomItem dalam rentang tanggal)
    prisma.bomItem.findMany({
      where: {
        order: {
          orderDate: where.orderDate ?? {},
          ...(status && status !== "all" ? { status } : {}),
        },
      },
      select: {
        fabricId: true,
        qtyActual: true,
        materialCost: true,
        fabric: { select: { name: true } },
      },
    }),
  ]);

  const rows = orders.map((o) => {
    const c = o.costing;
    const stagesTotal = o.timelines.length;
    const stagesCompleted = o.timelines.filter((t) => t.status === "completed").length;

    // On-time: hanya berlaku bila sudah shipped
    let onTime: boolean | null = null;
    if (o.status === "shipped") {
      const actualEnd = o.timelines.reduce<Date | null>((max, t) => {
        if (!t.actualEnd) return max;
        return !max || new Date(t.actualEnd) > max ? new Date(t.actualEnd) : max;
      }, null);
      if (actualEnd && o.deadline) onTime = actualEnd <= new Date(o.deadline);
      else if (o.deadline) onTime = new Date(o.orderDate) <= new Date(o.deadline);
      else onTime = true;
    }

    return {
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      status: o.status,
      orderDate: o.orderDate,
      deadline: o.deadline,
      revenue: c?.sellingPrice ?? 0,
      hpp: c?.hpp ?? 0,
      profit: c?.profit ?? 0,
      profitMargin: c?.profitMargin ?? 0,
      onTime,
      stagesTotal,
      stagesCompleted,
      materialCost: c?.materialCost ?? 0,
      laborCost: c?.laborCost ?? 0,
      shippingCost: c?.shippingCost ?? 0,
      otherCostTotal: c?.otherCostTotal ?? 0,
      otherCosts: c?.costItems ?? [],
      pricingMethod: c?.pricingMethod ?? "markup",
      markupPct: c?.markupPct ?? null,
      fixedProfit: c?.fixedProfit ?? 0,
    };
  });

  // Agregat
  const pipeline = { draft: 0, in_production: 0, qc: 0, shipped: 0 } as Record<string, number>;
  let revenue = 0, hpp = 0, profit = 0;
  let onTimeCount = 0, shippedCount = 0;
  for (const r of rows) {
    pipeline[r.status] = (pipeline[r.status] ?? 0) + 1;
    revenue += r.revenue;
    hpp += r.hpp;
    profit += r.profit;
    if (r.status === "shipped") {
      shippedCount++;
      if (r.onTime === true) onTimeCount++;
    }
  }
  const qcPending = pipeline.qc ?? 0;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const onTimeRate = shippedCount > 0 ? (onTimeCount / shippedCount) * 100 : 0;

  const fabricMap = new Map<string, { name: string; kg: number; cost: number }>();
  for (const b of bomItems) {
    const cur = fabricMap.get(b.fabricId) ?? { name: b.fabric.name, kg: 0, cost: 0 };
    cur.kg += b.qtyActual;
    cur.cost += b.materialCost;
    fabricMap.set(b.fabricId, cur);
  }
  const topFabrics = [...fabricMap.entries()]
    .map(([fabricId, v]) => ({
      fabricId,
      name: v.name,
      kg: Math.round(v.kg * 10) / 10,
      cost: Math.round(v.cost),
    }))
    .sort((a, b) => b.kg - a.kg)
    .slice(0, 5);

  return NextResponse.json({
    summary: {
      totalOrders: rows.length,
      pipeline,
      qcPending,
      onTimeCount,
      onTimeRate,
      revenue: Math.round(revenue),
      hpp: Math.round(hpp),
      profit: Math.round(profit),
      margin,
    },
    orders: rows,
    topFabrics,
  });
}
