import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { FABRIC_CATALOG } from "@/lib/master-data";

const prisma = new PrismaClient();

/**
 * Seed master fabric + warna default "Putih" per kain.
 * Warna "Putih" sebagai warna default — user bisa tambah warna lain via pembelian.
 * Run: npm run db:seed
 */
async function main() {
  console.log("🌱 Seed mulai...");

  // Bersihkan semua data lama
  await prisma.batchUsage.deleteMany();
  await prisma.orderCosting.deleteMany();
  await prisma.productionTimeline.deleteMany();
  await prisma.bomItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.fabricBatch.deleteMany();
  await prisma.fabricColor.deleteMany();
  await prisma.fabric.deleteMany();

  console.log("🗑️  Data lama dihapus");

  // Seed 24 jenis kain dari FABRIC_CATALOG
  // Setiap kain dibuat dengan 1 warna default "Putih"
  let fabricCount = 0;
  let colorCount = 0;

  for (const f of FABRIC_CATALOG) {
    const fabric = await prisma.fabric.upsert({
      where: { id: f.id },
      create: {
        id: f.id,
        name: f.name,
        unit: f.unit ?? "kg",
        reorderPoint: 5,
        isActive: true,
      },
      update: {
        name: f.name,
        unit: f.unit ?? "kg",
        isActive: true,
      },
    });
    fabricCount++;

    // Warna default "Putih" untuk setiap kain
    // User bisa tambah warna lain saat melakukan pembelian pertama warna tersebut
    await prisma.fabricColor.upsert({
      where: {
        fabricId_colorName: {
          fabricId: fabric.id,
          colorName: "Putih",
        },
      },
      create: {
        fabricId: fabric.id,
        colorName: "Putih",
        isActive: true,
      },
      update: {},
    });
    colorCount++;
  }

  console.log(`✅ ${fabricCount} kain + ${colorCount} warna default selesai`);
  console.log("💡 Warna lain akan muncul saat user pertama kali melakukan pembelian");
}

main()
  .catch((e) => {
    console.error("❌ Seed gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
