"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UserInfo {
  name?: string;
  email?: string;
  picture?: string;
}

/** Kartu profil user — ambil session dari Supabase Auth */
export function UserCard() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (u) {
        setUser({
          name:
            (u.user_metadata?.full_name as string) ||
            (u.user_metadata?.name as string) ||
            u.email ||
            "Pengguna",
          email: u.email,
          picture: u.user_metadata?.avatar_url as string | undefined,
        });
      }
      setLoading(false);
    });
  }, []);

  return (
    <Card className="mb-5 card-shadow-lg bg-gradient-to-br from-blue-500 to-blue-700 border-blue-300">
      <CardContent className="pt-5 pb-5 flex items-center gap-4">
        {user?.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.picture}
            alt={user.name || "Foto profil"}
            className="h-14 w-14 rounded-full border-2 border-white/60 object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 border-2 border-white/60">
            <User className="h-7 w-7 text-white" />
          </div>
        )}
        <div className="min-w-0">
          {loading ? (
            <p className="text-sm text-blue-100">Memuat profil...</p>
          ) : (
            <>
              <p className="text-lg font-bold text-white truncate">
                {user?.name || "Owner"}
              </p>
              <p className="text-sm text-blue-100 truncate">
                {user?.email || "H-Sport"}
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
