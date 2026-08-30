import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";

/** GET /api/profile — ambil profil pengguna dari database */
export async function GET() {
  const { user, error } = await requireUser();
  if (error || !user) return error;

  try {
    let profile = await prisma.profile.findUnique({
      where: { id: user.id },
    });

    // Jika belum ada record profil, buatkan default dari session Supabase
    if (!profile) {
      const metadata = user.user_metadata || {};
      const fullName =
        (metadata.full_name as string) ||
        (metadata.name as string) ||
        user.email?.split("@")[0] ||
        "Owner";
      const avatarUrl = (metadata.avatar_url as string) || null;

      profile = await prisma.profile.create({
        data: {
          id: user.id,
          email: user.email ?? "",
          fullName,
          avatarUrl,
          businessName: "H-Sport",
          role: "owner",
        },
      });
    }

    return NextResponse.json(profile);
  } catch (err) {
    console.error("GET /api/profile error:", err);
    return NextResponse.json(
      { error: "Gagal mengambil data profil" },
      { status: 500 }
    );
  }
}

/** PUT /api/profile — update profil pengguna di database */
export async function PUT(request: Request) {
  const { user, error } = await requireUser();
  if (error || !user) return error;

  try {
    const body = await request.json();
    const { fullName, businessName, phone, avatarUrl } = body;

    const profile = await prisma.profile.upsert({
      where: { id: user.id },
      update: {
        fullName: fullName !== undefined ? fullName : undefined,
        businessName: businessName !== undefined ? businessName : undefined,
        phone: phone !== undefined ? phone : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
      },
      create: {
        id: user.id,
        email: user.email ?? "",
        fullName: fullName || "Owner",
        businessName: businessName || "H-Sport",
        phone: phone || null,
        avatarUrl: avatarUrl || null,
        role: "owner",
      },
    });

    // Update metadata di auth Supabase agar sinkron
    if (fullName) {
      const supabase = await createClient();
      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          avatar_url: avatarUrl || profile.avatarUrl,
        },
      });
    }

    return NextResponse.json(profile);
  } catch (err) {
    console.error("PUT /api/profile error:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui data profil" },
      { status: 500 }
    );
  }
}
