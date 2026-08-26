import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format angka ke Rupiah: 52000 -> "Rp 52.000" */
export function formatRupiah(value: number): string {
  return "Rp " + value.toLocaleString("id-ID");
}

/** Format ISO date ke "25 Agu 2026" */
/** Format tanggal (id-ID, "25 Agu 2026") — robust untuk ISO penuh/null/invalid */
export function formatDate(isoDate?: string | null): string {
  if (!isoDate) return "-";

  // API bisa mengirim "2026-08-25" atau "2026-08-25T00:00:00.000Z" (ISO penuh)
  const dateStr = isoDate.includes("T") ? isoDate.slice(0, 10) : isoDate;

  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Jumlah hari dari hari ini sampai deadline (0 = hari ini, negatif = sudah lewat) */
export function daysUntil(isoDate?: string | null): number {
  if (!isoDate) return 999;

  // API bisa mengirim "2026-08-25" atau ISO penuh "2026-08-25T00:00:00.000Z"
  const dateStr = isoDate.includes("T") ? isoDate.slice(0, 10) : isoDate;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  if (isNaN(target.getTime())) return 999;

  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

/** Label sisa hari: "Hari ini", "Besok", "3 hari lagi", "Terlambat 1 hari" */
export function daysLeftLabel(days: number): string {
  if (isNaN(days) || days === 999) return "Tanpa deadline";
  if (days < 0) return `Terlambat ${Math.abs(days)} hari`;
  if (days === 0) return "Hari ini";
  if (days === 1) return "Besok";
  return `${days} hari lagi`;
}

/** Warna teks untuk profit: hijau (positif), merah (negatif), abu (0) */
export function profitColor(value: number | null | undefined): string {
  if (value === null || value === undefined) return "text-muted-foreground";
  if (value < 0) return "text-red-600";
  if (value > 0) return "text-green-600";
  return "text-muted-foreground";
}

/** Geser tanggal ISO maju/mundur (e.g. "2026-08-25" -1 bulan = "2026-07-25") */
export function shiftMonth(dateStr: string, months: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}
