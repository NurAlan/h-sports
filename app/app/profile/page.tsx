"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { MenuGuide } from "@/components/tutorial/menu-guide";
import { GlobalTourDialog } from "@/components/tutorial/global-tour-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  SwatchBook,
  BarChart3,
  LogOut,
  ChevronRight,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { UserCard } from "@/components/profile/user-card";
import { useToast } from "@/components/toast/toast-provider";
import { resetAllTutorialState } from "@/lib/tutorial-storage";

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
    label: "Laporan Keuangan",
    subtitle: "Profit, omzet, HPP, margin",
    href: "/reports",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: BarChart3,
    label: "Laporan Produksi",
    subtitle: "Lead time, durasi stage & status",
    href: "/reports/produksi",
    color: "bg-amber-100 text-amber-600",
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const [tourOpen, setTourOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleResetTour = () => {
    resetAllTutorialState();
    toast.success("Status panduan berhasil di-reset! Panduan onboarding akan otomatis muncul kembali di Dashboard.");
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      {/* User card — info dari database & session */}
      <UserCard />
      <PageHeader
        title="Profile"
        subtitle="Pengaturan akun & data master"
        action={<MenuGuide menuKey="profile" />}
      />

      <div className="flex flex-col gap-3 mb-6">
        {/* Panduan Alur Bisnis Button Item */}
        <Card
          onClick={() => setTourOpen(true)}
          className="border-blue-200 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 card-shadow-lg cursor-pointer hover:shadow-xl hover:border-blue-300 active:scale-[0.99] transition-all"
        >
          <CardContent className="py-4 px-5">
            <div className="flex items-center gap-4">
              <div className="bg-primary text-white p-2.5 rounded-xl shadow-xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-primary">
                  Panduan Alur Bisnis H-Sport
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  5 langkah operasional dari stok hingga laporan
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-primary shrink-0" />
            </div>
          </CardContent>
        </Card>

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
                      <p className="text-base font-semibold text-foreground">
                        {item.label}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
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

        {/* Reset Panduan Button Item */}
        <Card
          onClick={handleResetTour}
          className="border-gray-300 bg-white card-shadow-lg cursor-pointer hover:shadow-xl hover:border-gray-400 active:scale-[0.99] transition-all"
        >
          <CardContent className="py-3.5 px-5">
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 text-gray-700 p-2.5 rounded-xl">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">
                  Reset Panduan Onboarding
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tampilkan kembali pop-up tur panduan di Dashboard
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logout button */}
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-base font-semibold text-red-700 hover:bg-red-100 active:scale-98 transition-all"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>

      <GlobalTourDialog open={tourOpen} onOpenChange={setTourOpen} />
    </div>
  );
}
