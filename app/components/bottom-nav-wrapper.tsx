"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";

/** Sembunyikan bottom nav di halaman yang tidak butuh navigasi (login, dll) */
const HIDDEN_PATHS = ["/login"];

export function BottomNavWrapper() {
  const pathname = usePathname();
  if (HIDDEN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return null;
  }
  return <BottomNav />;
}
