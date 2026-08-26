import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";
import { allocateFabricFIFO } from "@/lib/fifo";

interface Params {
  params: Promise<{ id: string }>;
}

/** GET /api/orders/[id] — detail order (BOM, timeline, costing) */
export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      bomItems: true,
      timelines: { orderBy: { createdAt: "asc" } },
      costing: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json(order);
}

/**
 * PATCH /api/orders/[id] — update status order
 * Status: draft → in_production → qc → shipped
 * ⚠️ Saat pindah ke in_production: lakukan FIFO deduction stok (dari BOM)
 */
export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { bomItems: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  }

  // FIFO deduction saat order masuk produksi (hanya sekali — dari draft/in_production)
  if (status === "in_production" && order.status === "draft") {
    try {
      await prisma.$transaction(async (tx) => {
        for (const bom of order.bomItems) {
          await allocateFabricFIFO(tx, bom.fabricId, bom.qtyActual, order.id);
        }
      });
    } catch (e) {
      return NextResponse.json(
        { error: (e as Error).message },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json(updated);
}

/** DELETE /api/orders/[id] — hapus order */
export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
