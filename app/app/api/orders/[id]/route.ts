import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";
import { allocateBOMFIFO } from "@/lib/fifo";

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

  // FIFO deduction saat order masuk produksi (hanya sekali — dari draft)
  if (status === "in_production" && order.status === "draft") {
    try {
      await prisma.$transaction(async (tx) => {
        await allocateBOMFIFO(tx, id);

        // Auto-create 5 stage timeline produksi (semua not_started)
        // Supaya timeline langsung muncul setelah order masuk produksi
        const stageCount = await tx.productionTimeline.count({ where: { orderId: id } });
        if (stageCount === 0) {
          const stages = [
            { stageName: "pengukuran", name: "Pengukuran" },
            { stageName: "pemotongan", name: "Pemotongan" },
            { stageName: "jahit", name: "Jahit" },
            { stageName: "finishing", name: "Finishing" },
            { stageName: "qc", name: "QC" },
          ];
          for (const s of stages) {
            await tx.productionTimeline.create({
              data: {
                orderId: id,
                stageName: s.stageName,
                status: "not_started",
              },
            });
          }
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
