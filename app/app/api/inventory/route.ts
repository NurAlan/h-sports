import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

/** GET /api/inventory — fabrics + stok per warna (hanya yang punya batch)
 * Response shape per fabric:
 * { id, name, unit, reorderPoint, totalStock, avgPrice, lastPurchase,
 *   colorCount, isLowStock,
 *   colors: [{ colorId, colorName, stock, avgPrice, lastPurchase }] }
 */
export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const fabrics = await prisma.fabric.findMany({
    where: {
      isActive: true,
      colors: { some: { batches: { some: {} } } }, // hanya fabric yang punya pembelian
    },
    orderBy: { name: "asc" },
    include: {
      colors: {
        where: { isActive: true },
        include: {
          batches: {
            select: { qtyRemaining: true, pricePerKg: true, purchaseDate: true },
          },
        },
      },
    },
  });

  const result = fabrics.map((f) => {
    // Aggregate per warna
    const colors = f.colors
      .filter((c) => c.batches.length > 0)
      .map((c) => {
        const stock = c.batches.reduce((s, b) => s + b.qtyRemaining, 0);
        const totalValue = c.batches.reduce((s, b) => s + b.qtyRemaining * b.pricePerKg, 0);
        const avgPrice = stock > 0 ? totalValue / stock : 0;
        const lastPurchase = c.batches.length
          ? new Date(Math.max(...c.batches.map((b) => new Date(b.purchaseDate).getTime())))
              .toISOString().split("T")[0]
          : null;
        return {
          colorId: c.id,
          colorName: c.colorName,
          stock: Math.round(stock * 10) / 10,
          avgPrice: Math.round(avgPrice),
          lastPurchase,
          isLowStock: stock > 0 && stock <= f.reorderPoint,
        };
      });

    const totalStock = colors.reduce((s, c) => s + c.stock, 0);
    const allBatches = f.colors.flatMap((c) => c.batches);
    const avgPriceTotal =
      totalStock > 0
        ? allBatches.reduce((s, b) => s + b.qtyRemaining * b.pricePerKg, 0) / totalStock
        : 0;
    const lastPurchase = allBatches.length
      ? new Date(Math.max(...allBatches.map((b) => new Date(b.purchaseDate).getTime())))
          .toISOString().split("T")[0]
      : null;

    return {
      id: f.id,
      name: f.name,
      unit: f.unit,
      reorderPoint: f.reorderPoint,
      totalStock: Math.round(totalStock * 10) / 10,
      stock: Math.round(totalStock * 10) / 10, // alias untuk backward compat
      avgPrice: Math.round(avgPriceTotal),
      lastPurchase,
      colorCount: colors.length,
      isLowStock: colors.some((c) => c.isLowStock),
      colors,
    };
  });

  return NextResponse.json(result, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
  });
}
