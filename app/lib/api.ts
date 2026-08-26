// ============================================================
// API Client — semua fetch ke Route Handlers (cookie auth otomatis)
// ============================================================

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let message = "Terjadi kesalahan";
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: unknown) =>
    request<T>(url, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(url: string, body: unknown) =>
    request<T>(url, { method: "PATCH", body: JSON.stringify(body) }),
  put: <T>(url: string, body: unknown) =>
    request<T>(url, { method: "PUT", body: JSON.stringify(body) }),
  del: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};

// ============================================================
// Types — match dengan Prisma schema
// ============================================================

export interface Fabric {
  id: string;
  name: string;
  unit: string;
  reorderPoint: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { batches: number; bomItems: number };
}

export interface FabricBatch {
  id: string;
  fabricId: string;
  supplierName: string;
  purchaseDate: string;
  qtyPurchased: number;
  qtyRemaining: number;
  pricePerKg: number;
  fabric?: { name: string };
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerContact: string | null;
  qtyItems: number;
  specification: string | null;
  status: "draft" | "in_production" | "qc" | "shipped";
  orderDate: string;
  deadline: string | null;
  costing?: OrderCosting | null;
}

export interface OrderCosting {
  id?: string;
  materialCost: number;
  laborCost: number;
  hpp: number;
  pricingMethod: "markup" | "fixed_profit";
  markupPct: number | null;
  fixedProfit: number;
  sellingPrice: number;
  shippingCost: number;
  profit: number;
  profitMargin: number;
}

export interface BomItem {
  id: string;
  orderId: string;
  fabricId: string;
  fabricColorId: string;
  fabricName: string;
  colorName: string;
  qtyRequired: number;
  wastePct: number;
  qtyActual: number;
  pricePerKg: number;
  materialCost: number;
}

export interface ProductionTimeline {
  id: string;
  orderId: string;
  stageName: string;
  status: "not_started" | "in_progress" | "completed";
  estimatedHrs: number | null;
  actualStart: string | null;
  actualEnd: string | null;
}

export interface MonthlySummary {
  month: string;
  totalOrders: number;
  totalRevenue: number;
  totalHpp: number;
  totalProfit: number;
  avgMargin: number;
}

export interface MonthSummary {
  revenue: number;
  hpp: number;
  profit: number;
  margin: number;
  orderCount: number;
}

export interface DashboardData {
  summaries: MonthlySummary[];
  thisMonth: MonthSummary;
  lastMonth: MonthSummary;
  totalStock: number;
  lowStock: { id: string; name: string; stock: number; reorderPoint: number }[];
  activeOrders: Order[];
}

export interface ReportsData {
  summary: {
    revenue: number;
    hpp: number;
    profit: number;
    margin: number;
    counted: number;
  };
  orders: Order[];
  summaries: MonthlySummary[];
}

export interface ProductionReportOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  status: "draft" | "in_production" | "qc" | "shipped";
  orderDate: string;
  deadline: string | null;
  revenue: number;
  hpp: number;
  profit: number;
  profitMargin: number;
  onTime: boolean | null;
  stagesTotal: number;
  stagesCompleted: number;
}

export interface ProductionReportData {
  summary: {
    totalOrders: number;
    pipeline: Record<string, number>;
    qcPending: number;
    onTimeCount: number;
    onTimeRate: number;
    revenue: number;
    hpp: number;
    profit: number;
    margin: number;
  };
  orders: ProductionReportOrder[];
  topFabrics: { fabricId: string; name: string; kg: number; cost: number }[];
}
