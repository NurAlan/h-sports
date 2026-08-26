import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

interface Params {
  params: Promise<{ id: string }>;
}

/** GET /api/fabrics/[id] — detail kain */
export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const fabric = await prisma.fabric.findUnique({
    where: { id },
    include: {
      batches: { orderBy: { purchaseDate: "desc" } },
    },
  });

  if (!fabric) {
    return NextResponse.json({ error: "Kain tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json(fabric);
}

/** PATCH /api/fabrics/[id] — edit kain */
export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const { name, unit, reorderPoint, isActive } = body;

  const fabric = await prisma.fabric.update({
    where: { id },
    data: {
      ...(name?.trim() ? { name: name.trim() } : {}),
      ...(unit ? { unit } : {}),
      ...(reorderPoint !== undefined ? { reorderPoint } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
  });
  return NextResponse.json(fabric);
}

/** DELETE /api/fabrics/[id] — hapus kain (hanya jika belum dipakai) */
export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;

  // Cek apakah kain sudah dipakai (pembelian/BOM) — aturan bisnis
  const usage = await prisma.fabric.findFirst({
    where: {
      id,
      OR: [{ batches: { some: {} } }, { bomItems: { some: {} } }],
    },
    select: { id: true },
  });

  if (usage) {
    return NextResponse.json(
      { error: "Kain sudah punya riwayat pembelian/BOM — tidak bisa dihapus" },
      { status: 409 }
    );
  }

  await prisma.fabric.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
