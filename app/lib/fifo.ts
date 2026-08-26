import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * FIFO Stock Deduction
 * Kurangi stok kain dari batch tertua yang masih tersedia.
 * Mencatat pemakaian di batch_usage dan mengupdate qty_remaining.
 * Wajib dijalankan dalam Prisma transaction.
 */
export interface FIFOAllocation {
  batchId: string;
  qtyUsed: number;
  unitCost: number;
}

export async function allocateFabricFIFO(
  tx: Prisma.TransactionClient,
  fabricId: string,
  qtyNeeded: number,
  orderId: string
): Promise<FIFOAllocation[]> {
  if (qtyNeeded <= 0) return [];

  // Ambil batch tertua yang masih punya sisa (FIFO)
  const batches = await tx.fabricBatch.findMany({
    where: { fabricId, qtyRemaining: { gt: 0 } },
    orderBy: { purchaseDate: "asc" }, // tertua dulu
  });

  let remaining = qtyNeeded;
  const allocations: FIFOAllocation[] = [];

  for (const batch of batches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.qtyRemaining, remaining);

    // Update sisa batch
    await tx.fabricBatch.update({
      where: { id: batch.id },
      data: { qtyRemaining: { decrement: take } },
    });

    // Catat pemakaian
    await tx.batchUsage.create({
      data: {
        batchId: batch.id,
        orderId,
        qtyUsed: take,
      },
    });

    allocations.push({ batchId: batch.id, qtyUsed: take, unitCost: batch.pricePerKg });
    remaining -= take;
  }

  if (remaining > 0.001) {
    throw new Error(
      `Stok tidak cukup: butuh ${qtyNeeded}kg, tersedia ${qtyNeeded - remaining}kg`
    );
  }

  return allocations;
}

/** Hitung stok tersedia & harga rata-rata per kain (live) */
export async function getFabricStockSummary(fabricId: string) {
  const batches = await prisma.fabricBatch.findMany({
    where: { fabricId },
    select: { qtyRemaining: true, pricePerKg: true },
  });

  const stock = batches.reduce((s, b) => s + b.qtyRemaining, 0);
  const totalValue = batches.reduce((s, b) => s + b.qtyRemaining * b.pricePerKg, 0);
  const avgPrice = stock > 0 ? totalValue / stock : 0;

  return { stock, avgPrice, totalValue };
}
