// Baseline performa — read-only. Jalankan: node --env-file=.env.local scripts/perf-baseline.mjs
import { PrismaClient } from "@prisma/client";

const N = 5; // ulangi tiap kueri utk median

function now() {
  return performance.now();
}

function fmt(ms) {
  return `${ms.toFixed(1)} ms`;
}

function summarize(name, samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  console.log(`${name.padEnd(46)} median ${fmt(median).padStart(9)}  min ${fmt(min).padStart(9)}  max ${fmt(max).padStart(9)}`);
}

async function bench(label, fn) {
  const samples = [];
  for (let i = 0; i < N; i++) {
    const t0 = now();
    await fn();
    samples.push(now() - t0);
  }
  summarize(label, samples);
}

console.log("=== H-SPORT PERF BASELINE ===");
console.log(`instance: ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "?"}`);

// 1. Cold start Prisma (dari koneksi pertama)
let t0 = now();
const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
await prisma.$connect();
console.log(`prisma $connect (koneksi pertama): ${fmt(now() - t0)}`);
console.log("");

// 2. Latensi jaringan murni
await bench("SELECT 1 (round-trip DB)", () => prisma.$queryRaw`SELECT 1`);
console.log("");

const RANGE = { gte: new Date("2026-08-01"), lte: new Date("2026-08-31") };

// 3. Kueri di /api/reports
await bench("reports: orders + costing (range agt)", () =>
  prisma.order.findMany({ where: { orderDate: RANGE }, orderBy: { orderDate: "desc" }, include: { costing: true } })
);
await bench("reports: monthlySummary take 6", () =>
  prisma.monthlySummary.findMany({ orderBy: { month: "asc" }, take: 6 })
);

// 4. Kueri di /api/dashboard
await bench("dashboard: shipped order bulan ini", () =>
  prisma.order.findMany({ where: { status: "shipped", orderDate: { gte: RANGE.gte } }, include: { costing: true } })
);
await bench("dashboard: lowStock fabric->colors->batches", () =>
  prisma.fabric.findMany({
    where: { isActive: true, colors: { some: { batches: { some: {} } } } },
    include: { colors: { include: { batches: { select: { qtyRemaining: true } } } } },
  })
);
await bench("dashboard: activeOrders take 5", () =>
  prisma.order.findMany({ where: { status: { in: ["draft", "in_production", "qc"] } }, orderBy: { deadline: "asc" }, take: 5 })
);

// 5. Kueri di /api/orders (tanpa filter)
await bench("orders: semua order + costing", () =>
  prisma.order.findMany({ orderBy: { orderDate: "desc" }, include: { costing: true } })
);

// 6. Kueri di /api/production
await bench("production: order in_prod/qc + timeline + bom", () =>
  prisma.order.findMany({
    where: { status: { in: ["in_production", "qc"] } },
    orderBy: [{ deadline: "asc" }, { orderDate: "desc" }],
    include: { timelines: { orderBy: { createdAt: "asc" } }, bomItems: { include: { fabricColor: { include: { fabric: true } } } } },
  })
);

// 7. Kueri di /api/reports/produksi (2 query)
await bench("produksi: orders + costing + timelines (range agt)", () =>
  prisma.order.findMany({ where: { orderDate: RANGE }, orderBy: { orderDate: "desc" }, include: { costing: true, timelines: true } })
);
await bench("produksi: bomItems via order.orderDate", () =>
  prisma.bomItem.findMany({ where: { order: { orderDate: RANGE } }, include: { fabric: true } })
);

// 8. Kueri di /api/inventory
await bench("inventory: fabric->colors->batches", () =>
  prisma.fabric.findMany({
    where: { isActive: true, colors: { some: { batches: { some: {} } } } },
    orderBy: { name: "asc" },
    include: { colors: { where: { isActive: true }, include: { batches: { select: { qtyRemaining: true, pricePerKg: true, purchaseDate: true } } } } },
  })
);

await prisma.$disconnect();
console.log("\n=== SELESAI ===");
