import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

interface Params {
  params: Promise<{ id: string; colorId: string }>;
}

/**
 * DELETE /api/fabrics/[id]/colors/[colorId] — hapus warna kain jika belum digunakan di BOM / produksi
 */
export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id: fabricId, colorId } = await params;

  const fabricColor = await prisma.fabricColor.findFirst({
    where: { id: colorId, fabricId },
    include: {
      fabric: { select: { name: true } },
      batches: { select: { id: true } },
    },
  });

  if (!fabricColor) {
    return NextResponse.json({ error: "Warna kain tidak ditemukan" }, { status: 404 });
  }

  const batchIds = fabricColor.batches.map((b) => b.id);

  // Cek apakah warna ini terikat di BOM
  const bomUsage = await prisma.bomItem.findFirst({
    where: {
      OR: [
        { fabricColorId: colorId },
        { batchId: { in: batchIds } },
      ],
    },
    select: {
      order: { select: { orderNumber: true, status: true } },
    },
  });

  if (bomUsage) {
    return NextResponse.json(
      {
        error: `Warna "${fabricColor.colorName}" tidak dapat dihapus: sedang digunakan pada Order ${bomUsage.order.orderNumber} (Status: ${bomUsage.order.status}). Hapus dari komposisi (BOM) pesanan terlebih dahulu.`,
      },
      { status: 400 }
    );
  }

  // Cek apakah batch dari warna ini sudah pernah tercatat di BatchUsage (produksi)
  if (batchIds.length > 0) {
    const prodUsage = await prisma.batchUsage.findFirst({
      where: { batchId: { in: batchIds } },
    });
    if (prodUsage) {
      return NextResponse.json(
        {
          error: `Warna "${fabricColor.colorName}" tidak dapat dihapus: sudah pernah tercatat dalam pemakaian produksi.`,
        },
        { status: 400 }
      );
    }
  }

  // Hapus warna (cascade menghapus batches warna ini jika ada yang tersisa)
  await prisma.fabricColor.delete({ where: { id: colorId } });

  return NextResponse.json({ success: true });
}
