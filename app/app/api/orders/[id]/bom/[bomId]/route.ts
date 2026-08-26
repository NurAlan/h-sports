import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

interface Params {
  params: Promise<{ id: string; bomId: string }>;
}

/**
 * PATCH /api/orders/[id]/bom/[bomId] — edit bahan BOM
 * Body: { qtyRequired?, wastePercentage? } → hitung ulang qtyActual & materialCost
 */
export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id, bomId } = await params;
  const body = await request.json();
  const { qtyRequired, wastePercentage } = body;

  const item = await prisma.bomItem.findFirst({ where: { id: bomId, orderId: id } });
  if (!item) {
    return NextResponse.json({ error: "Bahan tidak ditemukan" }, { status: 404 });
  }

  const newQtyRequired = qtyRequired !== undefined ? parseFloat(qtyRequired) : item.qtyRequired;
  const newWastePct = wastePercentage !== undefined ? parseFloat(wastePercentage) : item.wastePct;
  const qtyActual = newQtyRequired * (1 + newWastePct / 100);

  const updated = await prisma.bomItem.update({
    where: { id: bomId },
    data: {
      qtyRequired: newQtyRequired,
      wastePct: newWastePct,
      qtyActual,
      materialCost: qtyActual * item.pricePerKg,
    },
  });
  return NextResponse.json(updated);
}

/** DELETE /api/orders/[id]/bom/[bomId] — hapus bahan dari BOM */
export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id, bomId } = await params;

  const item = await prisma.bomItem.findFirst({ where: { id: bomId, orderId: id } });
  if (!item) {
    return NextResponse.json({ error: "Bahan tidak ditemukan" }, { status: 404 });
  }

  await prisma.bomItem.delete({ where: { id: bomId } });
  return NextResponse.json({ success: true });
}
