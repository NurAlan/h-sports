import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

/** GET /api/fabric-batches?fabricId=xxx — riwayat batch per kain */
export async function GET(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const fabricId = searchParams.get("fabricId");

  const batches = await prisma.fabricBatch.findMany({
    where: fabricId ? { fabricId } : {},
    orderBy: { purchaseDate: "desc" },
    include: { fabric: { select: { name: true } } },
  });
  return NextResponse.json(batches);
}

/** POST /api/fabric-batches — tambah pembelian kain (batch baru) */
export async function POST(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const body = await request.json();
  const { fabricId, supplierName, purchaseDate, qtyPurchased, pricePerKg } = body;

  if (!fabricId || !supplierName?.trim() || !qtyPurchased || !pricePerKg) {
    return NextResponse.json(
      { error: "Data batch tidak lengkap" },
      { status: 400 }
    );
  }

  const batch = await prisma.fabricBatch.create({
    data: {
      fabricId,
      supplierName: supplierName.trim(),
      purchaseDate: new Date(purchaseDate),
      qtyPurchased: parseFloat(qtyPurchased),
      qtyRemaining: parseFloat(qtyPurchased), // batch baru = stok penuh
      pricePerKg: parseFloat(pricePerKg),
    },
  });
  return NextResponse.json(batch, { status: 201 });
}
