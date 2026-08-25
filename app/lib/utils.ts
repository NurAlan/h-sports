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
export function formatDate(isoDate: string): string {
  return new Date(isoDate + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Jumlah hari dari hari ini sampai deadline (0 = hari ini, negatif = sudah lewat) */
export function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate + "T00:00:00");
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

/** Label sisa hari: "Hari ini", "Besok", "3 hari lagi", "Terlambat 1 hari" */
export function daysLeftLabel(days: number): string {
  if (days < 0) return `Terlambat ${Math.abs(days)} hari`;
  if (days === 0) return "Hari ini";
  if (days === 1) return "Besok";
  return `${days} hari lagi`;
}

/** Geser tanggal ISO maju/mundur (e.g. "2026-08-25" -1 bulan = "2026-07-25") */
export function shiftMonth(dateStr: string, months: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}
