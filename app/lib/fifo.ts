import { PrismaClient } from "@prisma/client";

/**
 * FIFO deduction per FabricColor (ADR-0001)
 *
 * Alokasikan stok dari batch tertua untuk satu FabricColor.
 * Dipanggil saat Order berubah status ke "in_production".
 *
 * @param tx - Prisma transaction client
 * @param fabricColorId - ID FabricColor yang akan dikurangi
 * @param qtyNeeded - Total qty yang dibutuhkan (sudah termasuk waste)
 * @param orderId - ID Order (untuk mencatat BatchUsage)
 * @returns total qty yang berhasil dialokasikan
 */
export async function allocateFabricColorFIFO(
  tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  fabricColorId: string,
  qtyNeeded: number,
  orderId: string
): Promise<number> {
  // Ambil batch tertua yang masih punya stok (FIFO: purchaseDate ASC)
  const batches = await tx.fabricBatch.findMany({
    where: {
      fabricColorId,
      qtyRemaining: { gt: 0 },
    },
    orderBy: { purchaseDate: "asc" },
  });

  let remaining = qtyNeeded;
  let totalAllocated = 0;

  for (const batch of batches) {
    if (remaining <= 0) break;

    const take = Math.min(batch.qtyRemaining, remaining);

    // Kurangi stok batch
    await tx.fabricBatch.update({
      where: { id: batch.id },
      data: { qtyRemaining: { decrement: take } },
    });

    // Catat pemakaian di BatchUsage
    await tx.batchUsage.create({
      data: {
        batchId: batch.id,
        orderId,
        qtyUsed: take,
      },
    });

    remaining -= take;
    totalAllocated += take;
  }

  return totalAllocated;
}

/**
 * FIFO deduction untuk semua BomItem dalam satu Order
 *
 * Dipanggil dalam transaksi saat Order → in_production.
 * Rollback otomatis jika stok tidak cukup untuk salah satu item.
 *
 * @throws Error jika stok tidak cukup untuk salah satu FabricColor
 */
export async function allocateBOMFIFO(
  tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  orderId: string
): Promise<void> {
  // Ambil semua BomItem untuk order ini
  const bomItems = await tx.bomItem.findMany({
    where: { orderId },
    include: {
      fabricColor: {
        include: {
          fabric: { select: { name: true } },
        },
      },
    },
  });

  if (bomItems.length === 0) {
    throw new Error("Order tidak punya BOM — tambah bahan dulu sebelum memulai produksi");
  }

  // Cek stok cukup untuk semua item SEBELUM deduct (atomic check)
  for (const item of bomItems) {
    const stockAgg = await tx.fabricBatch.aggregate({
      where: {
        fabricColorId: item.fabricColorId,
        qtyRemaining: { gt: 0 },
      },
      _sum: { qtyRemaining: true },
    });

    const available = stockAgg._sum.qtyRemaining ?? 0;
    if (available < item.qtyActual) {
      const fabricName = item.fabricColor.fabric.name;
      const colorName = item.fabricColor.colorName;
      throw new Error(
        `Stok tidak cukup: ${fabricName} — ${colorName}: butuh ${item.qtyActual.toFixed(1)}kg, tersedia ${available.toFixed(1)}kg`
      );
    }
  }

  // Deduct semua item (stok sudah pasti cukup)
  for (const item of bomItems) {
    await allocateFabricColorFIFO(tx, item.fabricColorId, item.qtyActual, orderId);
  }
}
