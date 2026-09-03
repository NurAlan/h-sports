import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";
import { syncOrderCosting } from "@/lib/costing-sync";

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
    orderBy: { createdAt: "asc" },
  });

  // Serialize: tambah fabricName + colorName + batchInfo untuk UI
  const result = items.map((item) => ({
    ...item,
    fabricName: item.fabricColor.fabric.name,
    colorName: item.fabricColor.colorName,
    batchInfo: item.batch
      ? {
          purchaseDate: item.batch.purchaseDate,
          supplierName: item.batch.supplierName,
          pricePerKg: item.batch.pricePerKg,
          qtyRemaining: item.batch.qtyRemaining,
        }
      : null,
  }));

  return NextResponse.json(result);
}

/**
 * POST /api/orders/[id]/bom — tambah bahan ke BOM
 * Body: { fabricId, fabricColorId, batchId, qtyRequired }
 * Harga diambil dari batch yang dipilih user (manual selection, no waste)
 */
export async function POST(request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const { fabricId, fabricColorId, batchId, qtyRequired } = body;

  if (!fabricId || !fabricColorId || !batchId || !qtyRequired) {
    return NextResponse.json(
      { error: "fabricId, fabricColorId, batchId, dan jumlah wajib diisi" },
      { status: 400 }
    );
  }

  const qtyRequiredNum = parseFloat(qtyRequired);
  if (isNaN(qtyRequiredNum) || qtyRequiredNum <= 0) {
    return NextResponse.json(
      { error: "Jumlah harus berupa angka lebih dari 0" },
      { status: 400 }
    );
  }

  // BOM hanya bisa diubah saat order masih draft
  const order = await prisma.order.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  }
  if (order.status !== "draft") {
    return NextResponse.json(
      { error: "Order sudah memasuki produksi — BOM tidak bisa diubah. Kembalikan status ke Draft untuk mengubah bahan." },
      { status: 403 }
    );
  }

  // Cek duplikat: batch yang sama di order yang sama cukup diedit
  const existing = await prisma.bomItem.findFirst({
    where: { orderId: id, batchId },
    select: {
      fabricColor: { select: { colorName: true, fabric: { select: { name: true } } } },
    },
  });
  if (existing) {
    return NextResponse.json(
      {
        error: `Batch untuk ${existing.fabricColor.fabric.name} — ${existing.fabricColor.colorName} ini sudah ada di BOM. Gunakan Edit untuk mengubah jumlahnya.`,
      },
      { status: 409 }
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

  // Cek batch ada dan valid
  const batch = await prisma.fabricBatch.findUnique({
    where: { id: batchId },
    select: { id: true, pricePerKg: true, qtyRemaining: true, fabricColorId: true, purchaseDate: true, supplierName: true },
  });

  if (!batch) {
    return NextResponse.json(
      { error: "Batch pembelian tidak ditemukan" },
      { status: 404 }
    );
  }

  if (batch.fabricColorId !== fabricColorId) {
    return NextResponse.json(
      { error: "Batch tidak sesuai dengan jenis & warna kain yang dipilih" },
      { status: 400 }
    );
  }

  // Validasi stok: hard block jika qty > batch.qtyRemaining
  if (qtyRequiredNum > batch.qtyRemaining) {
    return NextResponse.json(
      {
        error: `Stok batch tidak cukup: tersedia ${batch.qtyRemaining.toFixed(1)}kg, dibutuhkan ${qtyRequiredNum.toFixed(1)}kg`,
      },
      { status: 400 }
    );
  }

  // Waste dihilangkan: qtyActual = qtyRequiredNum
  const qtyActual = qtyRequiredNum;
  const pricePerKg = batch.pricePerKg;
  const materialCost = qtyActual * pricePerKg;

  const item = await prisma.bomItem.create({
    data: {
      orderId: id,
      fabricId,
      fabricColorId,
      batchId,
      qtyRequired: qtyRequiredNum,
      wastePct: 0,
      qtyActual,
      pricePerKg,
      materialCost,
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

  // Otomatis sinkronisasi costing order jika sudah ada
  await syncOrderCosting(id);

  return NextResponse.json({
    ...item,
    fabricName: item.fabricColor.fabric.name,
    colorName: item.fabricColor.colorName,
    batchInfo: item.batch
      ? {
          purchaseDate: item.batch.purchaseDate,
          supplierName: item.batch.supplierName,
          pricePerKg: item.batch.pricePerKg,
          qtyRemaining: item.batch.qtyRemaining,
        }
      : null,
  }, { status: 201 });
}
