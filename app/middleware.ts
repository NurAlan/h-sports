import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "hsport-auth";

/**
 * Proteksi halaman: semua route (kecuali /login) memerlukan cookie login.
 * Mock auth — akan diganti auth asli (NextAuth/Supabase) saat integrasi.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = request.cookies.get(AUTH_COOKIE)?.value === "1";

  // Halaman login: jika sudah login, langsung ke dashboard
  if (pathname.startsWith("/login")) {
    if (authed) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Halaman lain: wajib login
  if (!authed) {
    const loginUrl = new URL("/login", request.url);
    // Simpan halaman tujuan supaya bisa redirect balik setelah login
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Semua route kecuali static assets & API internal
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
