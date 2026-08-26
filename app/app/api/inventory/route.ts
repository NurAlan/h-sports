import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

/** GET /api/inventory — fabrics + stok live + avg price (untuk grid inventory)
 * Hanya tampilkan kain yang:
 * 1. Sudah pernah ada pembelian (batchCount > 0)
 * 2. Datanya aktif
 */
export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const fabrics = await prisma.fabric.findMany({
    where: {
      isActive: true,
      batches: { some: {} }, // hanya fabric yang punya minimal 1 batch pembelian
    },
    orderBy: { name: "asc" },
    include: {
      batches: { select: { qtyRemaining: true, pricePerKg: true, purchaseDate: true } },
    },
  });

  const result = fabrics.map((f) => {
    const stock = f.batches.reduce((s, b) => s + b.qtyRemaining, 0);
    const totalValue = f.batches.reduce((s, b) => s + b.qtyRemaining * b.pricePerKg, 0);
    const avgPrice = stock > 0 ? totalValue / stock : 0;
    const lastPurchase = f.batches.length
      ? new Date(Math.max(...f.batches.map((b) => new Date(b.purchaseDate).getTime())))
          .toISOString()
          .split("T")[0]
      : null;

    return {
      id: f.id,
      name: f.name,
      unit: f.unit,
      reorderPoint: f.reorderPoint,
      stock: Math.round(stock * 10) / 10,
      avgPrice: Math.round(avgPrice),
      lastPurchase,
      batchCount: f.batches.length,
      isLowStock: stock > 0 && stock <= f.reorderPoint,
    };
  });

  return NextResponse.json(result, {
    headers: {
      // Cache 60 detik di Vercel Edge, stale-while-revalidate 5 menit
      "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
    },
  });
}
