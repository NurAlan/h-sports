"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { MenuGuide } from "@/components/tutorial/menu-guide";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  SwatchBook,
  BarChart3,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { UserCard } from "@/components/profile/user-card";

const menuItems = [
  {
    icon: User,
    label: "Pengaturan Profil",
    subtitle: "Nama, kontak, informasi usaha",
    href: "/profile/settings",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: SwatchBook,
    label: "Master Fabric",
    subtitle: "Kelola jenis kain (tambah, ubah, hapus)",
    href: "/profile/fabrics",
    color: "bg-violet-100 text-violet-600",
  },
  {
    icon: BarChart3,
    label: "Laporan",
    subtitle: "Profit, trend, pemakaian kain",
    href: "/reports",
    color: "bg-green-100 text-green-600",
  },
];

export default function ProfilePage() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };
  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      {/* User card — info dari cookie (parsed client-side) */}
      <UserCard />
      <PageHeader title="Profile" subtitle="Pengaturan akun & data master" action={<MenuGuide menuKey="profile" />} />

      <div className="flex flex-col gap-3 mb-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="border-gray-300 bg-white card-shadow-lg cursor-pointer hover:shadow-xl transition-all">
                <CardContent className="py-4 px-5">
                  <div className="flex items-center gap-4">
                    <div className={`${item.color} p-2.5 rounded-xl`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Logout button */}
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </div>
  );
}
