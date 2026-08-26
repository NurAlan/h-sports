import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

interface Params {
  params: Promise<{ id: string }>;
}

/** GET /api/orders/[id]/costing — data costing order */
export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const costing = await prisma.orderCosting.findUnique({
    where: { orderId: id },
  });
  return NextResponse.json(costing ?? {});
}

/**
 * PUT /api/orders/[id]/costing — simpan costing
 * Body: { laborCost, pricingMethod, markupPct, fixedProfit, shippingCost }
 * HPP & profit dihitung server-side dari BOM + input
 */
export async function PUT(request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const { laborCost, pricingMethod = "markup", markupPct, fixedProfit, shippingCost = 0 } = body;

  // Hitung material cost dari BOM
  const bomAgg = await prisma.bomItem.aggregate({
    where: { orderId: id },
    _sum: { materialCost: true },
  });
  const materialCost = bomAgg._sum.materialCost ?? 0;
  const labor = parseFloat(laborCost) || 0;
  const hpp = materialCost + labor;
  const shipping = parseFloat(shippingCost) || 0;

  // Hitung harga jual & profit
  let sellingPrice: number;
  let profit: number;
  if (pricingMethod === "fixed_profit") {
    profit = parseFloat(fixedProfit) || 0;
    sellingPrice = hpp + profit + shipping;
  } else {
    const markup = parseFloat(markupPct) || 0;
    sellingPrice = hpp * (1 + markup / 100) + shipping;
    profit = sellingPrice - hpp - shipping;
  }
  const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

  const costing = await prisma.orderCosting.upsert({
    where: { orderId: id },
    create: {
      orderId: id,
      materialCost,
      laborCost: labor,
      hpp,
      pricingMethod,
      markupPct: pricingMethod === "markup" ? parseFloat(markupPct) || 0 : null,
      fixedProfit: pricingMethod === "fixed_profit" ? parseFloat(fixedProfit) || 0 : 0,
      sellingPrice,
      shippingCost: shipping,
      profit,
      profitMargin,
    },
    update: {
      materialCost,
      laborCost: labor,
      hpp,
      pricingMethod,
      markupPct: pricingMethod === "markup" ? parseFloat(markupPct) || 0 : null,
      fixedProfit: pricingMethod === "fixed_profit" ? parseFloat(fixedProfit) || 0 : 0,
      sellingPrice,
      shippingCost: shipping,
      profit,
      profitMargin,
    },
  });
  return NextResponse.json(costing);
}
