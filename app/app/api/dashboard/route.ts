import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

/** GET /api/dashboard — ringkasan operasional order untuk dashboard */
export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const in7Days = new Date(today);
  in7Days.setDate(today.getDate() + 7);

  const [
    totalOrders,
    runningOrders,
    draftOrders,
    overdueOrders,
    upcomingDeadlineOrders,
    lowStockFabrics,
  ] = await Promise.all([
    // Total semua order
    prisma.order.count(),

    // Order berjalan: in_production + qc
    prisma.order.count({
      where: { status: { in: ["in_production", "qc"] } },
    }),

    // Order masih draft
    prisma.order.count({
      where: { status: "draft" },
    }),

    // Order terlewat deadline (belum selesai, deadline < hari ini)
    prisma.order.count({
      where: {
        status: { in: ["draft", "in_production", "qc"] },
        deadline: { lt: today },
      },
    }),

    // Order mendekati deadline (belum selesai, deadline antara hari ini s/d 7 hari ke depan)
    prisma.order.count({
      where: {
        status: { in: ["draft", "in_production", "qc"] },
        deadline: { gte: today, lte: in7Days },
      },
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
  ]);

  // ── Low stock fabrics ────────────────────────────────────────────────────
  const lowStock = lowStockFabrics
    .map((f) => {
      const stock = f.colors.reduce(
        (s, c) => s + c.batches.reduce((bs, b) => bs + b.qtyRemaining, 0),
        0
      );
      return { id: f.id, name: f.name, stock, reorderPoint: f.reorderPoint };
    })
    .filter((f) => f.stock > 0 && f.stock <= f.reorderPoint);

  return NextResponse.json({
    orderStats: {
      total: totalOrders,
      running: runningOrders,
      draft: draftOrders,
      overdue: overdueOrders,
      upcomingDeadline: upcomingDeadlineOrders,
    },
    lowStock,
  });
}
