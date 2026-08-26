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
  const items = await prisma.bomItem.findMany({
    where: { orderId: id },
    include: {
      fabricColor: {
        select: {
          colorName: true,
          fabric: { select: { name: true } },
        },
      },
    },
  });

  // Serialize: tambah fabricName + colorName untuk UI
  const result = items.map((item) => ({
    ...item,
    fabricName: item.fabricColor.fabric.name,
    colorName: item.fabricColor.colorName,
  }));

  return NextResponse.json(result);
}

/**
 * POST /api/orders/[id]/bom — tambah bahan ke BOM
 * Body: { fabricId, fabricColorId, qtyRequired, wastePercentage }
 * Harga diambil dari batch FIFO per FabricColor (harga rata-rata stok tersedia)
 */
export async function POST(request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const { fabricId, fabricColorId, qtyRequired, wastePercentage = 0 } = body;

  if (!fabricId || !fabricColorId || !qtyRequired) {
    return NextResponse.json(
      { error: "fabricId, fabricColorId, dan jumlah wajib diisi" },
      { status: 400 }
    );
  }

  // Cek FabricColor ada
  const fabricColor = await prisma.fabricColor.findUnique({
    where: { id: fabricColorId },
    include: { fabric: { select: { name: true } } },
  });
  if (!fabricColor) {
    return NextResponse.json({ error: "Warna kain tidak ditemukan" }, { status: 404 });
  }

  const qtyActual = parseFloat(qtyRequired) * (1 + parseFloat(wastePercentage) / 100);

  // Cek stok tersedia per FabricColor
  const stockResult = await prisma.fabricBatch.aggregate({
    where: { fabricColorId, qtyRemaining: { gt: 0 } },
    _sum: { qtyRemaining: true },
  });
  const stock = (stockResult._sum?.qtyRemaining) ?? 0;

  if (stock < qtyActual) {
    return NextResponse.json(
      {
        error: `Stok tidak cukup: ${fabricColor.fabric.name} — ${fabricColor.colorName}: butuh ${qtyActual.toFixed(1)}kg, tersedia ${stock.toFixed(1)}kg`,
      },
      { status: 400 }
    );
  }

  // Harga rata-rata FIFO per FabricColor (weighted dari sisa stok)
  const batches = await prisma.fabricBatch.findMany({
    where: { fabricColorId, qtyRemaining: { gt: 0 } },
    select: { qtyRemaining: true, pricePerKg: true },
  });
  const totalValue = batches.reduce((s, b) => s + b.qtyRemaining * b.pricePerKg, 0);
  const totalQty = batches.reduce((s, b) => s + b.qtyRemaining, 0);
  const avgPrice = totalQty > 0 ? totalValue / totalQty : 0;

  const item = await prisma.bomItem.create({
    data: {
      orderId: id,
      fabricId,
      fabricColorId,
      qtyRequired: parseFloat(qtyRequired),
      wastePct: parseFloat(wastePercentage),
      qtyActual,
      pricePerKg: avgPrice,
      materialCost: qtyActual * avgPrice,
    },
    include: {
      fabricColor: {
        select: {
          colorName: true,
          fabric: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json({
    ...item,
    fabricName: item.fabricColor.fabric.name,
    colorName: item.fabricColor.colorName,
  }, { status: 201 });
}
