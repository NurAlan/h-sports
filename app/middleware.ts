import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Middleware: proteksi route + refresh session Supabase.
 * Halaman selain /login & /api/auth/* wajib punya session valid.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Semua route kecuali static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
