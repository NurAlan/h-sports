import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

interface Params {
  params: Promise<{ id: string }>;
}

/** PATCH /api/fabric-batches/[id] — edit batch (perbaiki kesalahan input) */
export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const { supplierName, purchaseDate, qtyPurchased, qtyRemaining, pricePerKg } = body;

  const batch = await prisma.fabricBatch.update({
    where: { id },
    data: {
      ...(supplierName?.trim() ? { supplierName: supplierName.trim() } : {}),
      ...(purchaseDate ? { purchaseDate: new Date(purchaseDate) } : {}),
      ...(qtyPurchased !== undefined ? { qtyPurchased: parseFloat(qtyPurchased) } : {}),
      ...(qtyRemaining !== undefined ? { qtyRemaining: parseFloat(qtyRemaining) } : {}),
      ...(pricePerKg !== undefined ? { pricePerKg: parseFloat(pricePerKg) } : {}),
    },
  });
  return NextResponse.json(batch);
}

/**
 * DELETE /api/fabric-batches/[id] — hapus batch yang belum digunakan
 * Validasi ketat: batch tidak boleh terikat di BOM (termasuk draft) dan tidak boleh ada di BatchUsage
 */
export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;

  // Cek apakah batch sudah digunakan di BOM (termasuk order Draft)
  const bomUsage = await prisma.bomItem.findFirst({
    where: { batchId: id },
    select: {
      order: { select: { orderNumber: true, status: true } },
      fabricColor: {
        select: {
          colorName: true,
          fabric: { select: { name: true } },
        },
      },
    },
  });

  if (bomUsage) {
    return NextResponse.json(
      {
        error: `Batch tidak dapat dihapus: sedang digunakan di Order ${bomUsage.order.orderNumber} (Status: ${bomUsage.order.status}) untuk kain ${bomUsage.fabricColor.fabric.name} — ${bomUsage.fabricColor.colorName}. Hapus bahan ini dari komposisi (BOM) pesanan terlebih dahulu.`,
      },
      { status: 400 }
    );
  }

  // Cek apakah batch sudah masuk produksi (ada BatchUsage)
  const productionUsage = await prisma.batchUsage.findFirst({
    where: { batchId: id },
    select: { orderId: true },
  });

  if (productionUsage) {
    return NextResponse.json(
      {
        error: "Batch tidak dapat dihapus: sudah pernah tercatat dalam pemakaian produksi.",
      },
      { status: 400 }
    );
  }

  // Batch aman untuk dihapus
  await prisma.fabricBatch.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
