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
