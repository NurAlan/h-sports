import { prisma } from "@/lib/prisma";

/**
 * Sinkronisasi material cost dan HPP/sellingPrice/profit pada order_costing
 * jika order sudah memiliki data costing sebelumnya.
 */
export async function syncOrderCosting(orderId: string) {
  const costing = await prisma.orderCosting.findUnique({
    where: { orderId },
  });

  if (!costing) return null;

  const bomAgg = await prisma.bomItem.aggregate({
    where: { orderId },
    _sum: { materialCost: true },
  });
  const materialCost = bomAgg._sum.materialCost ?? 0;

  const labor = costing.laborCost;
  const shipping = costing.shippingCost;
  const otherCostTotal = costing.otherCostTotal;
  const hpp = materialCost + labor + otherCostTotal;

  let sellingPrice: number;
  let profit: number;
  if (costing.pricingMethod === "fixed_profit") {
    profit = costing.fixedProfit;
    sellingPrice = hpp + profit + shipping;
  } else {
    const markup = costing.markupPct ?? 0;
    sellingPrice = hpp * (1 + markup / 100) + shipping;
    profit = sellingPrice - hpp - shipping;
  }
  const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

  return prisma.orderCosting.update({
    where: { orderId },
    data: {
      materialCost,
      hpp,
      sellingPrice,
      profit,
      profitMargin,
    },
  });
}
