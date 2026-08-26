import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

/** GET /api/orders — daftar order (opsional filter status & search) */
export async function GET(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const orders = await prisma.order.findMany({
    where: {
      ...(status && status !== "all" ? { status } : {}),
      ...(search
        ? {
            OR: [
              { customerName: { contains: search, mode: "insensitive" } },
              { orderNumber: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { orderDate: "desc" },
    include: { costing: true },
  });
  return NextResponse.json(
    orders,
    { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=300" } }
  );
}

/** POST /api/orders — buat order baru */
export async function POST(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const body = await request.json();
  const {
    customerName,
    customerContact,
    qtyItems,
    specification,
    orderDate,
    deadline,
  } = body;

  if (!customerName?.trim() || !qtyItems) {
    return NextResponse.json(
      { error: "Customer dan jumlah item wajib diisi" },
      { status: 400 }
    );
  }

  // Generate nomor order unik: ORD-YYYYMMDD-NNN
  const dateStr = (orderDate || new Date().toISOString().split("T")[0]).replace(/-/g, "");
  const count = await prisma.order.count();
  const orderNumber = `ORD-${dateStr}-${String(count + 1).padStart(3, "0")}`;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerName: customerName.trim(),
      customerContact: customerContact || null,
      qtyItems: parseInt(qtyItems),
      specification: specification || null,
      status: "draft",
      orderDate: new Date(orderDate || new Date()),
      deadline: deadline ? new Date(deadline) : null,
    },
  });
  return NextResponse.json(order, { status: 201 });
}
