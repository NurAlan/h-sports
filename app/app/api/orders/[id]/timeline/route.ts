import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

interface Params {
  params: Promise<{ id: string }>;
}

/** GET /api/orders/[id]/timeline — stages produksi */
export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const timelines = await prisma.productionTimeline.findMany({
    where: { orderId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(timelines);
}

/**
 * POST /api/orders/[id]/timeline — simpan/update stages
 * Body: { stages: [{ stageName, status, estimatedHrs }] }
 */
export async function POST(request: Request, { params }: Params) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const { stages } = body;

  if (!Array.isArray(stages) || stages.length === 0) {
    return NextResponse.json(
      { error: "Stages wajib diisi" },
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // Hapus timeline lama, lalu buat ulang (replace pattern)
    await tx.productionTimeline.deleteMany({ where: { orderId: id } });

    const created = [];
    for (const s of stages) {
      const item = await tx.productionTimeline.create({
        data: {
          orderId: id,
          stageName: s.stageName,
          status: s.status,
          estimatedHrs: s.estimatedHrs,
          ...(s.status === "in_progress" ? { actualStart: new Date() } : {}),
          ...(s.status === "completed" ? { actualEnd: new Date() } : {}),
        },
      });
      created.push(item);
    }
    return created;
  });
  return NextResponse.json(result);
}
