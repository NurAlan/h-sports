import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/fabrics/[id] — detail fabric dengan colors + batches
 * Digunakan untuk batch selection di BOM dialog dan halaman detail inventory
 */
export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;

  const fabric = await prisma.fabric.findUnique({
    where: { id },
    include: {
      colors: {
        where: { isActive: true },
        include: {
          batches: {
            where: { qtyRemaining: { gt: 0 } },
            orderBy: { purchaseDate: "desc" },
            select: {
              id: true,
              supplierName: true,
              purchaseDate: true,
              qtyRemaining: true,
              pricePerKg: true,
            },
          },
        },
      },
    },
  });

  if (!fabric) {
    return NextResponse.json({ error: "Fabric tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(fabric);
}

/**
 * DELETE /api/fabrics/[id] — hapus master kain jika belum digunakan di BOM / produksi
 */
export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;

  const fabric = await prisma.fabric.findUnique({
    where: { id },
    include: {
      colors: {
        select: {
          id: true,
          colorName: true,
          batches: { select: { id: true } },
        },
      },
    },
  });

  if (!fabric) {
    return NextResponse.json({ error: "Kain tidak ditemukan" }, { status: 404 });
  }

  const colorIds = fabric.colors.map((c) => c.id);
  const batchIds = fabric.colors.flatMap((c) => c.batches.map((b) => b.id));

  // Cek apakah kain ini terikat di BOM (draft atau lainnya)
  const bomUsage = await prisma.bomItem.findFirst({
    where: {
      OR: [
        { fabricId: id },
        { fabricColorId: { in: colorIds } },
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
        error: `Kain "${fabric.name}" tidak dapat dihapus: sedang digunakan pada Order ${bomUsage.order.orderNumber} (Status: ${bomUsage.order.status}). Hapus kain ini dari komposisi (BOM) pesanan terlebih dahulu.`,
      },
      { status: 400 }
    );
  }

  // Cek apakah batch kain ini sudah ada catatan pemakaian produksi
  if (batchIds.length > 0) {
    const prodUsage = await prisma.batchUsage.findFirst({
      where: { batchId: { in: batchIds } },
    });
    if (prodUsage) {
      return NextResponse.json(
        {
          error: `Kain "${fabric.name}" tidak dapat dihapus: sudah pernah tercatat dalam pemakaian produksi.`,
        },
        { status: 400 }
      );
    }
  }

  // Aman untuk dihapus (cascade menghapus colors & batches kain ini)
  await prisma.fabric.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
