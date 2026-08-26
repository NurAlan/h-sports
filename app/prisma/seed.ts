import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { FABRIC_CATALOG } from "@/lib/master-data";

const prisma = new PrismaClient();

/** Seed master fabric dari FABRIC_CATALOG — id konsisten dengan UI */
async function main() {
  // Bersihkan data lama (id tidak konsisten) — aman karena belum ada relasi
  await prisma.batchUsage.deleteMany();
  await prisma.fabricBatch.deleteMany();
  await prisma.fabric.deleteMany();

  for (const f of FABRIC_CATALOG) {
    await prisma.fabric.upsert({
      where: { id: f.id },
      create: {
        id: f.id,
        name: f.name,
        unit: f.unit,
        reorderPoint: 5,
      },
      update: {
        name: f.name,
        unit: f.unit,
      },
    });
  }

  console.log(`✅ Seed selesai: ${FABRIC_CATALOG.length} jenis kain (data lama dibersihkan)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
