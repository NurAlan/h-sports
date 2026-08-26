import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

interface Params {
  params: Promise<{ id: string }>;
}

/** GET /api/fabrics/[id] — detail kain + semua warna + batch per warna */
export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;

  const fabric = await prisma.fabric.findUnique({
    where: { id },
    include: {
      colors: {
        where: { isActive: true },
        orderBy: { colorName: "asc" },
        include: {
          batches: {
            orderBy: { purchaseDate: "desc" },
          },
        },
      },
    },
  });

  if (!fabric) {
    return NextResponse.json({ error: "Kain tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(fabric);
}

/** PATCH /api/fabrics/[id] — edit nama/unit/reorderPoint */
export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const { name, unit, reorderPoint } = body;

  const fabric = await prisma.fabric.update({
    where: { id },
    data: {
      ...(name ? { name: name.trim() } : {}),
      ...(unit ? { unit } : {}),
      ...(reorderPoint !== undefined ? { reorderPoint } : {}),
    },
  });

  return NextResponse.json(fabric);
}

/** DELETE /api/fabrics/[id] — hapus kain (409 jika punya warna/BOM) */
export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;

  const usage = await prisma.fabric.findFirst({
    where: {
      id,
      OR: [
        { colors: { some: { batches: { some: {} } } } },
        { bomItems: { some: {} } },
      ],
    },
  });

  if (usage) {
    return NextResponse.json(
      { error: "Tidak bisa dihapus — kain sudah punya riwayat pembelian atau dipakai di BOM" },
      { status: 409 }
    );
  }

  await prisma.fabric.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
