import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

interface Params {
  params: Promise<{ id: string }>;
}

/** GET /api/orders/[id]/costing — data costing order + biaya lain */
export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const costing = await prisma.orderCosting.findUnique({
    where: { orderId: id },
    include: { costItems: { orderBy: { createdAt: "asc" } } },
  });
  if (!costing) return NextResponse.json({});
  return NextResponse.json({
    ...costing,
    otherCosts: costing.costItems,
  });
}

/**
 * PUT /api/orders/[id]/costing — simpan costing
 * Body: { laborCost, pricingMethod, markupPct, fixedProfit, shippingCost, otherCosts? }
 * HPP & profit dihitung server-side dari BOM + input.
 * otherCosts: [{ label, amount, keterangan? }] — disimpan hapus-semua + buat-ulang.
 */
export async function PUT(request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const {
    laborCost,
    pricingMethod = "markup",
    markupPct,
    fixedProfit,
    shippingCost = 0,
    otherCosts = [],
  } = body;

  // Hitung material cost dari BOM
  const bomAgg = await prisma.bomItem.aggregate({
    where: { orderId: id },
    _sum: { materialCost: true },
  });
  const materialCost = bomAgg._sum.materialCost ?? 0;
  const labor = parseFloat(laborCost) || 0;
  const shipping = parseFloat(shippingCost) || 0;

  // Biaya lain (sablon, resleting, aksesoris) — hanya item valid
  const otherItems = Array.isArray(otherCosts)
    ? otherCosts
        .filter(
          (c: { label?: string; amount?: unknown }) =>
            typeof c?.label === "string" && c.label.trim() && Number(c.amount) > 0
        )
        .map((c: { label: string; amount: unknown; keterangan?: string | null }) => ({
          label: c.label.trim(),
          amount: Number(c.amount),
          keterangan: c.keterangan?.trim() ? c.keterangan.trim() : null,
        }))
    : [];
  const otherCostTotal = otherItems.reduce((s, c) => s + c.amount, 0);

  // HPP = material + labor + biaya lain (ADR-0003). Ongkir tetap di luar HPP.
  const hpp = materialCost + labor + otherCostTotal;

  // Hitung harga jual & profit (ongkir dibebankan di atas harga jual)
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

  const costing = await prisma.$transaction(async (tx) => {
    const result = await tx.orderCosting.upsert({
      where: { orderId: id },
      create: {
        orderId: id,
        materialCost,
        laborCost: labor,
        shippingCost: shipping,
        otherCostTotal,
        hpp,
        pricingMethod,
        markupPct: pricingMethod === "markup" ? parseFloat(markupPct) || 0 : null,
        fixedProfit: pricingMethod === "fixed_profit" ? parseFloat(fixedProfit) || 0 : 0,
        sellingPrice,
        profit,
        profitMargin,
      },
      update: {
        materialCost,
        laborCost: labor,
        shippingCost: shipping,
        otherCostTotal,
        hpp,
        pricingMethod,
        markupPct: pricingMethod === "markup" ? parseFloat(markupPct) || 0 : null,
        fixedProfit: pricingMethod === "fixed_profit" ? parseFloat(fixedProfit) || 0 : 0,
        sellingPrice,
        profit,
        profitMargin,
      },
    });

    // Hapus semua + buat ulang biaya lain (pola sama seperti timeline)
    await tx.orderCostItem.deleteMany({ where: { orderId: id } });
    if (otherItems.length > 0) {
      await tx.orderCostItem.createMany({
        data: otherItems.map((c) => ({ orderId: id, label: c.label, amount: c.amount, keterangan: c.keterangan })),
      });
    }
    return result;
  });

  return NextResponse.json(costing);
}
