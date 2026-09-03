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

  // Bulan ini (untuk financial data)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [
    totalOrders,
    runningOrders,
    draftOrders,
    overdueOrders,
    upcomingDeadlineOrders,
    lowStockFabrics,
    monthlyOrders,
    needAttentionOrders,
    productionOrders,
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

    // Orders bulan ini (untuk financial data) - hanya yang shipped
    prisma.order.findMany({
      where: {
        status: "shipped",
        orderDate: { gte: startOfMonth, lte: endOfMonth },
      },
      include: {
        costing: true,
      },
    }),

    // Orders yang perlu perhatian (overdue, upcoming deadline, atau belum mulai produksi)
    prisma.order.findMany({
      where: {
        OR: [
          // Terlambat deadline
          {
            status: { in: ["draft", "in_production", "qc"] },
            deadline: { lt: today },
          },
          // Mendekati deadline
          {
            status: { in: ["draft", "in_production", "qc"] },
            deadline: { gte: today, lte: in7Days },
          },
        ],
      },
      include: {
        timelines: true,
        costing: true,
      },
      orderBy: { deadline: "asc" },
      take: 5, // Ambil 5 order teratas yang perlu perhatian
    }),

    // Orders yang sedang produksi (untuk production progress)
    prisma.order.findMany({
      where: {
        status: { in: ["in_production", "qc"] },
      },
      include: {
        timelines: true,
      },
      orderBy: { orderDate: "desc" },
      take: 5, // Ambil 5 order produksi teratas
    }),
  ]);

  // ── Financial Data (bulan ini) ───────────────────────────────────────────
  const financial = {
    revenue: 0,
    hpp: 0,
    profit: 0,
    margin: 0,
    orderCount: monthlyOrders.length,
  };

  for (const order of monthlyOrders) {
    if (order.costing) {
      financial.revenue += order.costing.sellingPrice;
      financial.hpp += order.costing.hpp;
      financial.profit += order.costing.profit;
    }
  }

  if (financial.revenue > 0) {
    financial.margin = (financial.profit / financial.revenue) * 100;
  }

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

  // ── Need Attention Alerts ────────────────────────────────────────────────
  const needAttention = needAttentionOrders.map((o) => {
    const stagesTotal = o.timelines.length;
    const stagesCompleted = o.timelines.filter((t) => t.status === "completed").length;
    const currentStage = o.timelines.find((t) => t.status === "in_progress")?.stageName || null;
    
    // Hitung sisa hari deadline
    let daysToDeadline: number | null = null;
    if (o.deadline) {
      const deadlineDate = new Date(o.deadline);
      daysToDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Tentukan severity (overdue, urgent, warning)
    let severity: "overdue" | "urgent" | "warning" = "warning";
    if (daysToDeadline !== null) {
      if (daysToDeadline < 0) {
        severity = "overdue";
      } else if (daysToDeadline <= 3) {
        severity = "urgent";
      }
    }

    // Tentukan issue
    let issue = "Mendekati deadline";
    if (severity === "overdue") {
      issue = `Terlambat ${Math.abs(daysToDeadline!)} hari`;
    } else if (o.status === "draft") {
      issue = "Belum mulai produksi";
    } else if (stagesCompleted === 0) {
      issue = "Produksi belum dimulai";
    }

    return {
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      status: o.status,
      deadline: o.deadline,
      daysToDeadline,
      severity,
      issue,
      currentStage,
      stagesCompleted,
      stagesTotal,
    };
  });

  // ── Production Progress ──────────────────────────────────────────────────
  const productionProgress = productionOrders.map((o) => {
    const stagesTotal = o.timelines.length;
    const stagesCompleted = o.timelines.filter((t) => t.status === "completed").length;
    const progressPct = stagesTotal > 0 ? Math.round((stagesCompleted / stagesTotal) * 100) : 0;
    const currentStage = o.timelines.find((t) => t.status === "in_progress")?.stageName || 
                         o.timelines.find((t) => t.status === "not_started")?.stageName || 
                         null;

    return {
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      status: o.status,
      currentStage,
      progressPct,
      stagesCompleted,
      stagesTotal,
    };
  });

  return NextResponse.json({
    orderStats: {
      total: totalOrders,
      running: runningOrders,
      draft: draftOrders,
      overdue: overdueOrders,
      upcomingDeadline: upcomingDeadlineOrders,
    },
    financial,
    lowStock,
    needAttention,
    productionProgress,
  });
}
