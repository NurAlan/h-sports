import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

interface Params {
  params: Promise<{ id: string }>;
}

/** GET /api/orders/[id]/bom — komposisi bahan order */
export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const items = await prisma.bomItem.findMany({ where: { orderId: id } });
  return NextResponse.json(items);
}

/**
 * POST /api/orders/[id]/bom — tambah bahan ke BOM
 * Body: { fabricId, qtyRequired, wastePercentage }
 * Harga diambil dari batch FIFO (harga rata-rata stok tersedia)
 */
export async function POST(request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const { fabricId, qtyRequired, wastePercentage = 0 } = body;

  if (!fabricId || !qtyRequired) {
    return NextResponse.json(
      { error: "Kain dan jumlah wajib diisi" },
      { status: 400 }
    );
  }

  const fabric = await prisma.fabric.findUnique({ where: { id: fabricId } });
  if (!fabric) {
    return NextResponse.json({ error: "Kain tidak ditemukan" }, { status: 404 });
  }

  // Cek stok tersedia
  const stockResult = await prisma.fabricBatch.aggregate({
    where: { fabricId, qtyRemaining: { gt: 0 } },
    _sum: { qtyRemaining: true },
  });
  const stock = stockResult._sum.qtyRemaining ?? 0;
  const qtyActual = parseFloat(qtyRequired) * (1 + parseFloat(wastePercentage) / 100);

  if (stock < qtyActual) {
    return NextResponse.json(
      { error: `Stok tidak cukup: butuh ${qtyActual.toFixed(1)}kg, tersedia ${stock.toFixed(1)}kg` },
      { status: 400 }
    );
  }

  // Harga rata-rata FIFO (weighted dari sisa stok)
  const priceResult = await prisma.fabricBatch.aggregate({
    where: { fabricId, qtyRemaining: { gt: 0 } },
    _sum: { qtyRemaining: true },
  });
  const valueResult = await prisma.fabricBatch.findMany({
    where: { fabricId, qtyRemaining: { gt: 0 } },
    select: { qtyRemaining: true, pricePerKg: true },
  });
  const totalValue = valueResult.reduce((s, b) => s + b.qtyRemaining * b.pricePerKg, 0);
  const totalQty = priceResult._sum.qtyRemaining ?? 0;
  const avgPrice = totalQty > 0 ? totalValue / totalQty : 0;

  const item = await prisma.bomItem.create({
    data: {
      orderId: id,
      fabricId,
      fabricName: fabric.name,
      qtyRequired: parseFloat(qtyRequired),
      wastePct: parseFloat(wastePercentage),
      qtyActual,
      pricePerKg: avgPrice,
      materialCost: qtyActual * avgPrice,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
