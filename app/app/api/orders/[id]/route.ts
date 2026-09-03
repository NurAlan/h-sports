import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

interface Params {
  params: Promise<{ id: string }>;
}

/** GET /api/orders/[id] — detail order (BOM, timeline, costing) */
export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      bomItems: {
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
      },
      timelines: { orderBy: { createdAt: "asc" } },
      costing: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  }

  // Serialize bomItems: tambahkan fabricName, colorName, batchInfo untuk UI
  const serialized = {
    ...order,
    bomItems: order.bomItems.map((item) => ({
      ...item,
      fabricName: item.fabricColor?.fabric?.name ?? "",
      colorName: item.fabricColor?.colorName ?? "",
      batchInfo: item.batch
        ? {
            purchaseDate: item.batch.purchaseDate,
            supplierName: item.batch.supplierName,
            pricePerKg: item.batch.pricePerKg,
            qtyRemaining: item.batch.qtyRemaining,
          }
        : null,
    })),
  };

  return NextResponse.json(serialized);
}

/**
 * PATCH /api/orders/[id] — update status order
 * Status: draft → in_production → qc → shipped
 * ⚠️ Saat pindah ke in_production: lakukan FIFO deduction stok (dari BOM)
 */
export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const { status, customerName, customerContact } = body;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { bomItems: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  }

  // Manual batch deduction saat order masuk produksi (hanya sekali — dari draft)
  // Potong stok dari batch yang sudah dipilih user di BOM
  if (status === "in_production" && order.status === "draft") {
    try {
      await prisma.$transaction(async (tx) => {
        // Deduct inventory berdasarkan batch yang dipilih di BOM
        for (const bomItem of order.bomItems) {
          if (!bomItem.batchId) {
            throw new Error(`BOM item untuk order ${order.orderNumber} tidak memiliki batch yang dipilih`);
          }

          // Kurangi stok batch sesuai qtyActual
          const batch = await tx.fabricBatch.findUnique({
            where: { id: bomItem.batchId },
          });

          if (!batch) {
            throw new Error(`Batch ${bomItem.batchId} tidak ditemukan`);
          }

          if (batch.qtyRemaining < bomItem.qtyActual) {
            throw new Error(
              `Stok batch tidak cukup. Diperlukan ${bomItem.qtyActual}kg, tersisa ${batch.qtyRemaining}kg`
            );
          }

          // Update batch remaining
          await tx.fabricBatch.update({
            where: { id: bomItem.batchId },
            data: { qtyRemaining: { decrement: bomItem.qtyActual } },
          });

          // Catat BatchUsage untuk audit trail
          await tx.batchUsage.create({
            data: {
              batchId: bomItem.batchId,
              orderId: id,
              qtyUsed: bomItem.qtyActual,
            },
          });
        }

        // Auto-create 5 stage timeline produksi (semua not_started)
        // Supaya timeline langsung muncul setelah order masuk produksi
        const stageCount = await tx.productionTimeline.count({ where: { orderId: id } });
        if (stageCount === 0) {
          const stages = [
            { stageName: "pengukuran", name: "Pengukuran" },
            { stageName: "pemotongan", name: "Pemotongan" },
            { stageName: "jahit", name: "Jahit" },
            { stageName: "finishing", name: "Finishing" },
            { stageName: "qc", name: "QC" },
          ];
          for (const s of stages) {
            await tx.productionTimeline.create({
              data: {
                orderId: id,
                stageName: s.stageName,
                status: "not_started",
              },
            });
          }
        }
      });
    } catch (e) {
      return NextResponse.json(
        { error: (e as Error).message },
        { status: 400 }
      );
    }
  }

  const dataToUpdate: {
    status?: string;
    customerName?: string;
    customerContact?: string | null;
  } = {};

  if (status !== undefined) {
    dataToUpdate.status = status;
  }

  if (customerName !== undefined) {
    if (!customerName.trim()) {
      return NextResponse.json(
        { error: "Nama customer tidak boleh kosong" },
        { status: 400 }
      );
    }
    dataToUpdate.customerName = customerName.trim();
  }

  if (customerContact !== undefined) {
    dataToUpdate.customerContact = customerContact?.trim() || null;
  }

  const updated = await prisma.order.update({
    where: { id },
    data: dataToUpdate,
  });
  return NextResponse.json(updated);
}

/** DELETE /api/orders/[id] — hapus order (idempotent) */
export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  try {
    await prisma.order.delete({ where: { id } });
  } catch (e) {
    // P2025 = record sudah tidak ada (mis. sudah dihapus sebelumnya) — anggap sukses
    if ((e as { code?: string }).code === "P2025") {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Gagal menghapus order" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
