import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

/** GET /api/fabrics — daftar master kain */
export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const fabrics = await prisma.fabric.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { batches: true, bomItems: true } },
    },
  });
  return NextResponse.json(fabrics, {
    headers: {
      // Master data kain jarang berubah — cache 5 menit
      "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
    },
  });
}

/** POST /api/fabrics — tambah kain baru */
export async function POST(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const body = await request.json();
  const { name, unit = "kg", reorderPoint = 5 } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Nama kain wajib diisi" }, { status: 400 });
  }

  const fabric = await prisma.fabric.create({
    data: { name: name.trim(), unit, reorderPoint },
  });
  return NextResponse.json(fabric, { status: 201 });
}
