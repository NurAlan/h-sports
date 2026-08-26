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
      bomItems: {
        select: {
          qtyActual: true,
          fabricColorId: true,
          fabricColor: {
            select: {
              colorName: true,
              fabric: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  // Serialize bomItems dengan fabricName + colorName
  const result = orders.map((order) => ({
    ...order,
    bomItems: order.bomItems.map((b) => ({
      ...b,
      fabricName: b.fabricColor.fabric.name,
      colorName: b.fabricColor.colorName,
    })),
  }));

  return NextResponse.json(result);
}
