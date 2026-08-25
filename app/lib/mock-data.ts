// Mock data untuk UI prototype (akan diganti API saat integrasi)

export interface Fabric {
  id: string;
  name: string;
  unit: string;
  reorderPoint: number;
}

export interface FabricBatch {
  id: string;
  fabricId: string;
  supplierName: string;
  purchaseDate: string; // ISO date
  qtyPurchased: number; // kg
  qtyRemaining: number; // kg
  pricePerKg: number; // Rp
}

export const fabrics: Fabric[] = [
  { id: "1", name: "Cotton Combed 30s", unit: "kg", reorderPoint: 10 },
  { id: "2", name: "Polyester PE", unit: "kg", reorderPoint: 5 },
  { id: "3", name: "Cotton Combed 24s", unit: "kg", reorderPoint: 15 },
  { id: "4", name: "Spandex Rayon", unit: "kg", reorderPoint: 10 },
];

export const fabricBatches: FabricBatch[] = [
  // Cotton Combed 30s — total sisa 45.5 kg
  {
    id: "b1",
    fabricId: "1",
    supplierName: "Supplier A",
    purchaseDate: "2026-07-10",
    qtyPurchased: 20,
    qtyRemaining: 12.5,
    pricePerKg: 50000,
  },
  {
    id: "b2",
    fabricId: "1",
    supplierName: "Supplier A",
    purchaseDate: "2026-08-01",
    qtyPurchased: 15,
    qtyRemaining: 15,
    pricePerKg: 52000,
  },
  {
    id: "b3",
    fabricId: "1",
    supplierName: "Supplier B",
    purchaseDate: "2026-08-20",
    qtyPurchased: 20,
    qtyRemaining: 18,
    pricePerKg: 54500,
  },
  // Polyester PE — total sisa 3.2 kg (menipis)
  {
    id: "b4",
    fabricId: "2",
    supplierName: "Supplier C",
    purchaseDate: "2026-07-25",
    qtyPurchased: 10,
    qtyRemaining: 3.2,
    pricePerKg: 45000,
  },
  {
    id: "b5",
    fabricId: "2",
    supplierName: "Supplier C",
    purchaseDate: "2026-08-18",
    qtyPurchased: 5,
    qtyRemaining: 0,
    pricePerKg: 47000,
  },
  // Cotton Combed 24s — total sisa 78 kg
  {
    id: "b6",
    fabricId: "3",
    supplierName: "Supplier A",
    purchaseDate: "2026-07-15",
    qtyPurchased: 50,
    qtyRemaining: 38,
    pricePerKg: 58000,
  },
  {
    id: "b7",
    fabricId: "3",
    supplierName: "Supplier D",
    purchaseDate: "2026-08-22",
    qtyPurchased: 50,
    qtyRemaining: 40,
    pricePerKg: 60000,
  },
  // Spandex Rayon — total sisa 8.5 kg (menipis)
  {
    id: "b8",
    fabricId: "4",
    supplierName: "Supplier E",
    purchaseDate: "2026-08-15",
    qtyPurchased: 10,
    qtyRemaining: 8.5,
    pricePerKg: 62000,
  },
];

/** Total stok tersedia untuk sebuah fabric (sum sisa batch) */
export function getFabricStock(fabricId: string): number {
  return fabricBatches
    .filter((b) => b.fabricId === fabricId)
    .reduce((sum, b) => sum + b.qtyRemaining, 0);
}

/** Harga rata-rata tertimbang (weighted by remaining stock) */
export function getFabricAvgPrice(fabricId: string): number {
  const batches = fabricBatches.filter((b) => b.fabricId === fabricId);
  const totalStock = batches.reduce((s, b) => s + b.qtyRemaining, 0);
  if (totalStock === 0) return 0;
  const totalValue = batches.reduce(
    (s, b) => s + b.qtyRemaining * b.pricePerKg,
    0
  );
  return totalValue / totalStock;
}

/** Tanggal pembelian terakhir */
export function getFabricLastPurchase(fabricId: string): string | null {
  const batches = fabricBatches.filter((b) => b.fabricId === fabricId);
  if (batches.length === 0) return null;
  return batches.sort((a, b) =>
    b.purchaseDate.localeCompare(a.purchaseDate)
  )[0].purchaseDate;
}

export function getFabricById(id: string): Fabric | undefined {
  return fabrics.find((f) => f.id === id);
}
