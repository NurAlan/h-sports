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
  purchaseDate: string;
  qtyPurchased: number;
  qtyRemaining: number;
  pricePerKg: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerContact: string;
  qtyItems: number;
  specification: string;
  status: "draft" | "in_production" | "qc" | "shipped" | "cancelled";
  orderDate: string;
  deadline: string; // estimasi selesai (due date)
  profit: string;
  stage: string;
}

export interface BOMItem {
  id: string;
  orderId: string;
  fabricId: string;
  fabricName: string;
  qtyRequired: number; // kg bersih
  wastePercentage: number;
  qtyActual: number; // qtyRequired * (1 + waste/100)
  pricePerKg: number;
  materialCost: number;
}

export interface StageTimeline {
  name: string;
  status: "not_started" | "in_progress" | "completed";
  duration: string;
  estimatedHrs: number;
  actualHrs: number | null;
}

export interface OrderCosting {
  materialCost: number;
  laborCost: number;
  hpp: number;
  pricingMethod: "markup" | "fixed_profit";
  markupPct: number;
  fixedProfit: number;
  sellingPrice: number;
  shippingCost: number;
  profit: number;
  profitMargin: number;
}

export const fabrics: Fabric[] = [
  { id: "fabric-cotton-combed-30", name: "Cotton Combed 30s", unit: "kg", reorderPoint: 10 },
  { id: "fabric-pe", name: "Polyester PE", unit: "kg", reorderPoint: 5 },
  { id: "fabric-cotton-combed-24", name: "Cotton Combed 24s", unit: "kg", reorderPoint: 15 },
  { id: "fabric-spandex", name: "Spandex / Lycra", unit: "kg", reorderPoint: 10 },
];

export const fabricBatches: FabricBatch[] = [
  { id: "b1", fabricId: "fabric-cotton-combed-30", supplierName: "Supplier A", purchaseDate: "2026-07-10", qtyPurchased: 20, qtyRemaining: 12.5, pricePerKg: 50000 },
  { id: "b2", fabricId: "fabric-cotton-combed-30", supplierName: "Supplier A", purchaseDate: "2026-08-01", qtyPurchased: 15, qtyRemaining: 15, pricePerKg: 52000 },
  { id: "b3", fabricId: "fabric-cotton-combed-30", supplierName: "Supplier B", purchaseDate: "2026-08-20", qtyPurchased: 20, qtyRemaining: 18, pricePerKg: 54500 },
  { id: "b4", fabricId: "fabric-pe", supplierName: "Supplier C", purchaseDate: "2026-07-25", qtyPurchased: 10, qtyRemaining: 3.2, pricePerKg: 45000 },
  { id: "b5", fabricId: "fabric-pe", supplierName: "Supplier C", purchaseDate: "2026-08-18", qtyPurchased: 5, qtyRemaining: 0, pricePerKg: 47000 },
  { id: "b6", fabricId: "fabric-cotton-combed-24", supplierName: "Supplier A", purchaseDate: "2026-07-15", qtyPurchased: 50, qtyRemaining: 38, pricePerKg: 58000 },
  { id: "b7", fabricId: "fabric-cotton-combed-24", supplierName: "Supplier D", purchaseDate: "2026-08-22", qtyPurchased: 50, qtyRemaining: 40, pricePerKg: 60000 },
  { id: "b8", fabricId: "fabric-spandex", supplierName: "Supplier E", purchaseDate: "2026-08-15", qtyPurchased: 10, qtyRemaining: 8.5, pricePerKg: 62000 },
];

// BOM items per order
export const bomItems: BOMItem[] = [
  { id: "bi1", orderId: "1", fabricId: "fabric-cotton-combed-30", fabricName: "Cotton Combed 30s", qtyRequired: 15, wastePercentage: 10, qtyActual: 16.5, pricePerKg: 50000, materialCost: 825000 },
  { id: "bi2", orderId: "1", fabricId: "fabric-spandex", fabricName: "Spandex / Lycra", qtyRequired: 3, wastePercentage: 5, qtyActual: 3.15, pricePerKg: 62000, materialCost: 195300 },
  { id: "bi3", orderId: "2", fabricId: "fabric-cotton-combed-30", fabricName: "Cotton Combed 30s", qtyRequired: 30, wastePercentage: 10, qtyActual: 33, pricePerKg: 52000, materialCost: 1716000 },
  { id: "bi4", orderId: "2", fabricId: "fabric-cotton-combed-24", fabricName: "Cotton Combed 24s", qtyRequired: 15, wastePercentage: 8, qtyActual: 16.2, pricePerKg: 58000, materialCost: 939600 },
];

// Timeline stages per order
export const orderTimelines: Record<string, StageTimeline[]> = {
  "1": [
    { name: "Pengukuran", status: "completed", duration: "2h", estimatedHrs: 2, actualHrs: 2 },
    { name: "Pemotongan", status: "completed", duration: "4.5h", estimatedHrs: 4, actualHrs: 4.5 },
    { name: "Jahit", status: "in_progress", duration: "8h / 12h", estimatedHrs: 12, actualHrs: 8 },
    { name: "Finishing", status: "not_started", duration: "3h", estimatedHrs: 3, actualHrs: null },
    { name: "QC", status: "not_started", duration: "1h", estimatedHrs: 1, actualHrs: null },
  ],
  "2": [
    { name: "Pengukuran", status: "completed", duration: "3h", estimatedHrs: 3, actualHrs: 3 },
    { name: "Pemotongan", status: "completed", duration: "5h", estimatedHrs: 5, actualHrs: 5 },
    { name: "Jahit", status: "completed", duration: "18h", estimatedHrs: 16, actualHrs: 18 },
    { name: "Finishing", status: "completed", duration: "4h", estimatedHrs: 4, actualHrs: 4 },
    { name: "QC", status: "in_progress", duration: "1.5h / 2h", estimatedHrs: 2, actualHrs: 1.5 },
  ],
};

// Costing per order
export const orderCostings: Record<string, OrderCosting> = {
  "1": {
    materialCost: 1020300,
    laborCost: 500000,
    hpp: 1520300,
    pricingMethod: "markup",
    markupPct: 30,
    fixedProfit: 0,
    sellingPrice: 1976390,
    shippingCost: 50000,
    profit: 406090,
    profitMargin: 20.5,
  },
  "2": {
    materialCost: 2655600,
    laborCost: 1000000,
    hpp: 3655600,
    pricingMethod: "markup",
    markupPct: 25,
    fixedProfit: 0,
    sellingPrice: 4569500,
    shippingCost: 75000,
    profit: 838900,
    profitMargin: 18.4,
  },
};

// === DATA GRAFIK DASHBOARD ===

export interface MonthlyStat {
  month: string; // label singkat: "Mar"
  revenue: number; // omzet (Rp)
  hpp: number; // harga pokok (Rp)
  profit: number; // profit = revenue - hpp - ongkir (Rp)
}

/** Tren 6 bulan terakhir (omzet, HPP, profit) */
export const monthlyStats: MonthlyStat[] = [
  { month: "Mar", revenue: 12400000, hpp: 9920000, profit: 2480000 },
  { month: "Apr", revenue: 13800000, hpp: 10902000, profit: 3098000 },
  { month: "Mei", revenue: 15200000, hpp: 11790000, profit: 3420000 },
  { month: "Jun", revenue: 16800000, hpp: 12936000, profit: 3780000 },
  { month: "Jul", revenue: 17500000, hpp: 13475000, profit: 4025000 },
  { month: "Agu", revenue: 18450000, hpp: 14120000, profit: 4330000 },
];

export const orders: Order[] = [
  { id: "1", orderNumber: "ORD-20260825-001", customerName: "Toko Baju Sejahtera", customerContact: "08123456789", qtyItems: 50, specification: "Ukuran: M, L, XL\nWarna: Navy Blue\nDesain: Logo depan", status: "in_production", orderDate: "2026-08-25", deadline: "2026-08-27", profit: "Rp 406,090", stage: "Jahit" },
  { id: "2", orderNumber: "ORD-20260824-003", customerName: "PT Garmen Indo", customerContact: "021-1234567", qtyItems: 100, specification: "Ukuran: S, M, L, XL\nWarna: Hitam, Putih", status: "qc", orderDate: "2026-08-24", deadline: "2026-08-26", profit: "Rp 838,900", stage: "QC" },
  { id: "3", orderNumber: "ORD-20260823-002", customerName: "CV Tekstil Makmur", customerContact: "087654321", qtyItems: 75, specification: "Ukuran: M, L\nWarna: Army Green", status: "shipped", orderDate: "2026-08-23", deadline: "2026-08-25", profit: "Rp 890,000", stage: "Terkirim" },
  { id: "4", orderNumber: "ORD-20260822-001", customerName: "Toko ABC", customerContact: "", qtyItems: 30, specification: "Ukuran: XL\nWarna: Navy", status: "in_production", orderDate: "2026-08-22", deadline: "2026-08-24", profit: "-", stage: "Pemotongan" },
];

// === HELPERS ===

export function getFabricStock(fabricId: string): number {
  return fabricBatches.filter((b) => b.fabricId === fabricId).reduce((sum, b) => sum + b.qtyRemaining, 0);
}

export function getFabricAvgPrice(fabricId: string): number {
  const batches = fabricBatches.filter((b) => b.fabricId === fabricId);
  const totalStock = batches.reduce((s, b) => s + b.qtyRemaining, 0);
  if (totalStock === 0) return 0;
  return batches.reduce((s, b) => s + b.qtyRemaining * b.pricePerKg, 0) / totalStock;
}

export function getFabricLastPurchase(fabricId: string): string | null {
  const batches = fabricBatches.filter((b) => b.fabricId === fabricId);
  if (batches.length === 0) return null;
  return batches.sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate))[0].purchaseDate;
}

export function getFabricById(id: string): Fabric | undefined {
  return fabrics.find((f) => f.id === id);
}

export function getOrderById(id: string): Order | undefined {
  return orders.find((o) => o.id === id);
}

export function getBOMForOrder(orderId: string): BOMItem[] {
  return bomItems.filter((b) => b.orderId === orderId);
}

export function getTimelineForOrder(orderId: string): StageTimeline[] {
  return orderTimelines[orderId] || [];
}

export function getCostingForOrder(orderId: string): OrderCosting | undefined {
  return orderCostings[orderId];
}