import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Verifikasi session untuk Route Handlers (server-side).
 * Return user atau NextResponse unauthorized.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user, error: null };
}
