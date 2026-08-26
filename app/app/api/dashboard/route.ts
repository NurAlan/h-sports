import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

/** GET /api/dashboard — summary untuk dashboard */
export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  // Ambil monthly summary (6 bulan terakhir)
  const summaries = await prisma.monthlySummary.findMany({
    orderBy: { month: "desc" },
    take: 6,
  });

  // Stok total
  const stockAgg = await prisma.fabricBatch.aggregate({
    _sum: { qtyRemaining: true },
  });
  const totalStock = stockAgg._sum.qtyRemaining ?? 0;

  // Low stock fabrics
  const lowStockFabrics = await prisma.fabric.findMany({
    where: {
      isActive: true,
      batches: {
        some: {},
      },
    },
    include: {
      batches: {
        select: { qtyRemaining: true, pricePerKg: true },
      },
    },
  });

  const lowStock = lowStockFabrics
    .map((f) => {
      const stock = f.batches.reduce((s, b) => s + b.qtyRemaining, 0);
      return { id: f.id, name: f.name, stock, reorderPoint: f.reorderPoint };
    })
    .filter((f) => f.stock <= f.reorderPoint);

  // Order aktif (deadline terdekat)
  const activeOrders = await prisma.order.findMany({
    where: { status: { in: ["draft", "in_production", "qc"] } },
    orderBy: { deadline: "asc" },
    take: 5,
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      status: true,
      deadline: true,
    },
  });

  return NextResponse.json({
    summaries,
    totalStock: Math.round(totalStock * 10) / 10,
    lowStock,
    activeOrders,
  });
}