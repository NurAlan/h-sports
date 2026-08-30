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
    // Ambil timeline yang ada untuk preserve start/end date jika tidak dikirim ulang
    const existing = await tx.productionTimeline.findMany({ where: { orderId: id } });
    const existingMap = new Map(existing.map((t) => [t.stageName, t]));

    // Hapus timeline lama, lalu buat ulang (replace pattern)
    await tx.productionTimeline.deleteMany({ where: { orderId: id } });

    const created = [];
    for (const s of stages) {
      const prev = existingMap.get(s.stageName);

      let actualStart: Date | null = null;
      if (s.actualStart) {
        actualStart = new Date(s.actualStart);
      } else if (prev?.actualStart) {
        actualStart = prev.actualStart;
      } else if (s.status === "in_progress" || s.status === "completed") {
        actualStart = new Date();
      }

      let actualEnd: Date | null = null;
      if (s.actualEnd) {
        actualEnd = new Date(s.actualEnd);
      } else if (prev?.actualEnd) {
        actualEnd = prev.actualEnd;
      } else if (s.status === "completed") {
        actualEnd = new Date();
      }

      const item = await tx.productionTimeline.create({
        data: {
          orderId: id,
          stageName: s.stageName,
          status: s.status,
          estimatedHrs: s.estimatedHrs != null ? Number(s.estimatedHrs) : null,
          actualStart,
          actualEnd,
        },
      });
      created.push(item);
    }
    return created;
  });
  return NextResponse.json(result);
}
