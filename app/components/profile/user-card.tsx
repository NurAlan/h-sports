"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import { api, type UserProfile } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

interface UserInfo {
  name?: string;
  businessName?: string;
  email?: string;
  picture?: string;
}

/** Kartu profil user — ambil profil dari database & session Supabase */
export function UserCard() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ambil dari database profiles terlebih dahulu
    api
      .get<UserProfile>("/api/profile")
      .then((profile) => {
        setUser({
          name: profile.fullName || "Owner",
          businessName: profile.businessName || "H-Sport",
          email: profile.email,
          picture: profile.avatarUrl || undefined,
        });
        setLoading(false);
      })
      .catch(async () => {
        // Fallback ke Supabase Auth jika API gagal
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        const u = data.user;
        if (u) {
          setUser({
            name:
              (u.user_metadata?.full_name as string) ||
              (u.user_metadata?.name as string) ||
              "Owner",
            businessName: "H-Sport",
            email: u.email,
            picture: u.user_metadata?.avatar_url as string | undefined,
          });
        }
        setLoading(false);
      });
  }, []);

  return (
    <Card className="mb-5 card-shadow-lg bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 border-stone-700/50 text-white">
      <CardContent className="pt-5 pb-5 flex items-center gap-4">
        {user?.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.picture}
            alt={user.name || "Foto profil"}
            className="h-14 w-14 rounded-full border-2 border-amber-400/60 object-cover shadow-sm"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-500/20 border-2 border-amber-400/40">
            <User className="h-7 w-7 text-amber-300" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="space-y-2">
              <div className="h-5 w-28 bg-white/20 rounded animate-pulse" />
              <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-white truncate">
                  {user?.name || "Owner"}
                </p>
                {user?.businessName && (
                  <span className="text-[11px] font-semibold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/30 truncate text-amber-200">
                    {user.businessName}
                  </span>
                )}
              </div>
              <p className="text-sm text-stone-300 truncate mt-0.5">
                {user?.email || "owner@hsport.id"}
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
