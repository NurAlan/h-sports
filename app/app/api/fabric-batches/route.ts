import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

/** GET /api/fabric-batches?fabricColorId=xxx — riwayat batch per warna */
export async function GET(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const fabricColorId = searchParams.get("fabricColorId");

  const batches = await prisma.fabricBatch.findMany({
    where: fabricColorId ? { fabricColorId } : {},
    include: {
      fabricColor: {
        select: {
          colorName: true,
          fabric: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { purchaseDate: "asc" },
  });

  return NextResponse.json(batches);
}

/** POST /api/fabric-batches — tambah pembelian kain (batch baru per warna) */
export async function POST(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const body = await request.json();
  const { fabricId, colorName, supplierName, purchaseDate, qtyPurchased, pricePerKg } = body;

  if (!fabricId || !colorName?.trim() || !qtyPurchased || !pricePerKg) {
    return NextResponse.json(
      { error: "fabricId, colorName, qtyPurchased, pricePerKg wajib diisi" },
      { status: 400 }
    );
  }

  // Upsert FabricColor — warna lahir dari pembelian pertama (ADR-0001)
  const fabricColor = await prisma.fabricColor.upsert({
    where: {
      fabricId_colorName: {
        fabricId,
        colorName: colorName.trim(),
      },
    },
    create: {
      fabricId,
      colorName: colorName.trim(),
      isActive: true,
    },
    update: {},
  });

  const batch = await prisma.fabricBatch.create({
    data: {
      fabricColorId: fabricColor.id,
      supplierName: supplierName ?? "",
      purchaseDate: new Date(purchaseDate),
      qtyPurchased,
      qtyRemaining: qtyPurchased,
      pricePerKg,
    },
  });

  return NextResponse.json(batch, { status: 201 });
}
