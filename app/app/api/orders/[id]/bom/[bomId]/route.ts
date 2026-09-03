import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";
import { syncOrderCosting } from "@/lib/costing-sync";

interface Params {
  params: Promise<{ id: string; bomId: string }>;
}

/**
 * PATCH /api/orders/[id]/bom/[bomId] — edit bahan BOM
 * Body: { qtyRequired, batchId? } → hitung ulang qtyActual & materialCost tanpa waste
 */
export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id, bomId } = await params;
  const body = await request.json();
  const { qtyRequired, batchId } = body;

  const order = await prisma.order.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  }
  if (order.status !== "draft") {
    return NextResponse.json(
      { error: "Order sudah memasuki produksi — BOM tidak bisa diubah." },
      { status: 403 }
    );
  }

  const item = await prisma.bomItem.findFirst({
    where: { id: bomId, orderId: id },
    include: { batch: true },
  });
  if (!item) {
    return NextResponse.json({ error: "Bahan tidak ditemukan" }, { status: 404 });
  }

  const newQtyRequired = qtyRequired !== undefined ? parseFloat(qtyRequired) : item.qtyRequired;
  if (isNaN(newQtyRequired) || newQtyRequired <= 0) {
    return NextResponse.json({ error: "Jumlah harus lebih dari 0" }, { status: 400 });
  }

  // Waste dihilangkan: qtyActual = newQtyRequired
  const qtyActual = newQtyRequired;

  const targetBatchId = batchId !== undefined ? batchId : item.batchId;
  let newPricePerKg = item.pricePerKg;

  if (targetBatchId) {
    const batch = await prisma.fabricBatch.findUnique({
      where: { id: targetBatchId },
      select: { pricePerKg: true, qtyRemaining: true, fabricColorId: true },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch tidak ditemukan" }, { status: 404 });
    }

    if (batch.fabricColorId !== item.fabricColorId) {
      return NextResponse.json(
        { error: "Batch tidak sesuai dengan warna yang dipilih" },
        { status: 400 }
      );
    }

    // Validasi stok
    if (qtyActual > batch.qtyRemaining) {
      return NextResponse.json(
        {
          error: `Stok batch tidak cukup: tersedia ${batch.qtyRemaining.toFixed(1)}kg, dibutuhkan ${qtyActual.toFixed(1)}kg`,
        },
        { status: 400 }
      );
    }

    newPricePerKg = batch.pricePerKg;
  }

  const updated = await prisma.bomItem.update({
    where: { id: bomId },
    data: {
      qtyRequired: newQtyRequired,
      wastePct: 0,
      qtyActual,
      ...(batchId !== undefined ? { batchId } : {}),
      pricePerKg: newPricePerKg,
      materialCost: qtyActual * newPricePerKg,
    },
    include: {
      fabricColor: {
        select: {
          colorName: true,
          fabric: { select: { name: true } },
        },
      },
      batch: {
        select: {
          id: true,
          purchaseDate: true,
          supplierName: true,
          pricePerKg: true,
          qtyRemaining: true,
        },
      },
    },
  });

  // Otomatis sinkronisasi costing order
  await syncOrderCosting(id);

  return NextResponse.json({
    ...updated,
    fabricName: updated.fabricColor.fabric.name,
    colorName: updated.fabricColor.colorName,
    batchInfo: updated.batch
      ? {
          purchaseDate: updated.batch.purchaseDate,
          supplierName: updated.batch.supplierName,
          pricePerKg: updated.batch.pricePerKg,
          qtyRemaining: updated.batch.qtyRemaining,
        }
      : null,
  });
}

/** DELETE /api/orders/[id]/bom/[bomId] — hapus bahan dari BOM */
export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id, bomId } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  }
  if (order.status !== "draft") {
    return NextResponse.json(
      { error: "Order sudah memasuki produksi — BOM tidak bisa diubah." },
      { status: 403 }
    );
  }

  const item = await prisma.bomItem.findFirst({ where: { id: bomId, orderId: id } });
  if (!item) {
    return NextResponse.json({ error: "Bahan tidak ditemukan" }, { status: 404 });
  }

  await prisma.bomItem.delete({ where: { id: bomId } });

  // Otomatis sinkronisasi costing order setelah bahan dihapus
  await syncOrderCosting(id);

  return NextResponse.json({ success: true });
}
