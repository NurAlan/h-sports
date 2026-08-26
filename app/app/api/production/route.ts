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
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerContact: true,
      qtyItems: true,
      specification: true,
      status: true,
      orderDate: true,
      deadline: true,
      createdAt: true,
      updatedAt: true,
      costing: { select: { sellingPrice: true, hpp: true, profit: true } },
      timelines: { orderBy: { createdAt: "asc" } },
      bomItems: {
        select: {
          id: true,
          qtyActual: true,
          fabricColorId: true,
          fabricId: true,
          fabricColor: {
            select: { colorName: true },
          },
          fabric: { select: { name: true } },
        },
      },
    },
  });

  // Serialize bomItems dengan fabricName + colorName
  const result = orders.map((order) => ({
    ...order,
    bomItems: order.bomItems.map((b) => ({
      ...b,
      fabricName: b.fabric?.name ?? "",
      colorName: b.fabricColor?.colorName ?? "",
    })),
  }));

  return NextResponse.json(
    result,
    { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=300" } }
  );
}
