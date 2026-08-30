import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

/** GET /api/fabrics — list semua kain aktif dengan jumlah warna dan stok total */
export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const fabrics = await prisma.fabric.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      colors: {
        where: { isActive: true },
        include: {
          batches: { select: { qtyRemaining: true } },
        },
      },
      _count: { select: { bomItems: true } },
    },
  });

  const result = fabrics.map((f) => {
    const totalStock = f.colors.reduce(
      (s, c) => s + c.batches.reduce((bs, b) => bs + b.qtyRemaining, 0),
      0
    );
    return {
      id: f.id,
      name: f.name,
      unit: f.unit,
      reorderPoint: f.reorderPoint,
      isActive: f.isActive,
      colorCount: f.colors.length,
      totalStock: Math.round(totalStock * 10) / 10,
      bomCount: f._count.bomItems,
    };
  });

  return NextResponse.json(result);
}

/** POST /api/fabrics — tambah jenis kain baru */
export async function POST(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const body = await request.json();
  const { name, unit = "kg", reorderPoint = 5 } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "name wajib diisi" }, { status: 400 });
  }

  const fabric = await prisma.fabric.create({
    data: { name: name.trim(), unit, reorderPoint },
  });

  return NextResponse.json(fabric, { status: 201 });
}
