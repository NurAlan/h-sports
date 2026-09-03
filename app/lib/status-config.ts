import { cn } from "@/lib/utils";

export interface StatusConfig {
  label: string;
  className: string;
}

export const ORDER_STATUS: Record<string, StatusConfig> = {
  draft: { label: "Draft", className: "bg-stone-100 text-stone-600 border border-stone-300" },
  in_production: { label: "Produksi", className: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
  qc: { label: "QC", className: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
  shipped: { label: "Selesai", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
};

export const BATCH_STATUS: Record<string, StatusConfig> = {
  unused: { label: "Belum Dipakai", className: "bg-secondary text-muted-foreground" },
  used: { label: "Terpakai", className: "bg-green-100 text-green-700" },
};

export const DEADLINE_STATUS = {
  overdue: { label: "Terlambat", className: "bg-red-700 text-white" },
  urgent: { label: "< 3 hari", className: "bg-red-500 text-white" },
  warning: { label: "< 7 hari", className: "bg-orange-500 text-white" },
  safe: { label: "Aman", className: "bg-green-100 text-green-700" },
} as const;

export function getStatusStyle(status: string, config: Record<string, StatusConfig>): StatusConfig {
  return config[status] ?? { label: status, className: "bg-secondary text-secondary-foreground" };
}

export function deadlineStatusClass(daysLeft: number | null): string {
  if (daysLeft === null) return DEADLINE_STATUS.safe.className;
  if (daysLeft < 0) return DEADLINE_STATUS.overdue.className;
  if (daysLeft <= 3) return DEADLINE_STATUS.urgent.className;
  if (daysLeft <= 7) return DEADLINE_STATUS.warning.className;
  return DEADLINE_STATUS.safe.className;
}

export function deadlineStatusLabel(daysLeft: number | null): string {
  if (daysLeft === null) return "";
  if (daysLeft < 0) return `${Math.abs(daysLeft)}h terlambat`;
  if (daysLeft === 0) return "Hari ini";
  return `${daysLeft} hari lagi`;
}

export { cn };
