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
