import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

/** GET /api/production — order aktif + timeline (untuk halaman production) */
export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const orders = await prisma.order.findMany({
    where: { status: { in: ["in_production", "qc"] } },
    orderBy: [{ deadline: "asc" }, { orderDate: "desc" }],
    include: {
      timelines: { orderBy: { createdAt: "asc" } },
      bomItems: { select: { fabricName: true, qtyActual: true } },
    },
  });

  return NextResponse.json(orders);
}