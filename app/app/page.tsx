"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { MenuGuide } from "@/components/tutorial/menu-guide";
import { GlobalTourDialog } from "@/components/tutorial/global-tour-dialog";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Wrench,
  CalendarClock,
  AlertTriangle,
  FileText,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import { DashboardSkeleton } from "@/components/skeletons";
import { api, type DashboardData } from "@/lib/api";
import {
  getHasSeenTour,
  getIsBannerDismissed,
  setBannerDismissed,
} from "@/lib/tutorial-storage";

interface StatCardProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  href: string;
  colorClass: string;
  iconColorClass: string;
  sublabel?: string;
}

function StatCard({ label, count, icon, href, colorClass, iconColorClass, sublabel }: StatCardProps) {
  return (
    <Link href={href} className="h-full block active:scale-[0.98] transition-transform">
      <Card className={`h-full card-shadow-lg border-2 transition-all hover:shadow-xl hover:-translate-y-0.5 ${colorClass}`}>
        <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full">
          <div>
            <div className={`inline-flex items-center justify-center h-9 w-9 rounded-xl mb-2.5 ${iconColorClass}`}>
              {icon}
            </div>
            <p className="text-2xl sm:text-3xl font-bold tabular-nums mb-0.5 tracking-tight min-w-0">{count}</p>
            <p className="text-xs sm:text-sm font-semibold text-foreground/90 leading-snug">{label}</p>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 min-h-[14px] leading-tight truncate">{sublabel ?? ""}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tourOpen, setTourOpen] = useState(false);
  const [bannerDismissed, setBannerDismissedState] = useState(false);

  useEffect(() => {
    api
      .get<DashboardData>("/api/dashboard")
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    // Auto-trigger tour on first visit if not yet seen
    if (!getHasSeenTour()) {
      const timer = setTimeout(() => {
        setTourOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
    setBannerDismissedState(getIsBannerDismissed());
  }, []);

  const handleDismissBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBannerDismissed(true);
    setBannerDismissedState(true);
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <PageHeader
        title="Dashboard"
        subtitle="Ringkasan status order"
        action={<MenuGuide menuKey="dashboard" />}
      />

      {/* Onboarding Quick Guide Banner */}
      {!bannerDismissed && (
        <div className="relative mb-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white shadow-md flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDismissBanner}
            aria-label="Tutup banner panduan"
            className="absolute top-2.5 right-2.5 text-blue-200 hover:text-white p-1 rounded-md hover:bg-white/10 active:scale-95 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">Panduan Baru</span>
            </div>
            <p className="text-base font-bold text-white leading-tight">Alur Lengkap Bisnis H-Sport</p>
            <p className="text-xs text-blue-100/90 truncate mt-0.5">5 langkah mudah dari stok kain hingga laporan profit</p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => setTourOpen(true)}
            className="shrink-0 min-h-[38px] bg-white text-primary font-bold hover:bg-blue-50 active:scale-95 shadow-sm"
          >
            Mulai Tur 🚀
          </Button>
        </div>
      )}

      <GlobalTourDialog
        open={tourOpen}
        onOpenChange={(open) => {
          setTourOpen(open);
          if (!open) {
            setBannerDismissedState(getIsBannerDismissed());
          }
        }}
      />

      {loading && <DashboardSkeleton />}

      {error && !loading && (
        <Card className="bg-red-50 border-red-300 card-shadow-lg">
          <CardContent className="py-6 text-center">
            <p className="text-base font-semibold text-red-700 mb-1">Gagal memuat data</p>
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && data && (
        <>
          {/* 5 Order Stat Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatCard
              label="Total Order"
              count={data.orderStats.total}
              icon={<ClipboardList className="h-5 w-5 text-primary" />}
              href="/orders"
              colorClass="bg-white border-gray-200"
              iconColorClass="bg-primary/10"
            />
            <StatCard
              label="Sedang Berjalan"
              count={data.orderStats.running}
              icon={<Wrench className="h-5 w-5 text-blue-600" />}
              href="/orders?status=in_production"
              colorClass="bg-blue-50 border-blue-200"
              iconColorClass="bg-blue-100"
              sublabel="Produksi + QC"
            />
            <StatCard
              label="Mendekati Deadline"
              count={data.orderStats.upcomingDeadline}
              icon={<CalendarClock className="h-5 w-5 text-amber-600" />}
              href="/orders?sortBy=deadline_asc"
              colorClass="bg-amber-50 border-amber-200"
              iconColorClass="bg-amber-100"
              sublabel="≤ 7 hari ke depan"
            />
            <StatCard
              label="Terlewat Deadline"
              count={data.orderStats.overdue}
              icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
              href="/orders?sortBy=deadline_asc"
              colorClass={data.orderStats.overdue > 0 ? "bg-red-50 border-red-300" : "bg-white border-gray-200"}
              iconColorClass={data.orderStats.overdue > 0 ? "bg-red-100" : "bg-gray-100"}
            />
          </div>

          {/* Draft stat — full width */}
          <div className="mb-4">
            <StatCard
              label="Masih Draft"
              count={data.orderStats.draft}
              icon={<FileText className="h-5 w-5 text-gray-500" />}
              href="/orders?status=draft"
              colorClass="bg-gray-50 border-gray-200"
              iconColorClass="bg-gray-100"
              sublabel="Belum mulai produksi"
            />
          </div>

          {/* Stok Menipis */}
          {data.lowStock.length > 0 && (
            <Card className="border-red-300 bg-red-50 card-shadow-lg border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Stok Menipis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.lowStock.map((f) => (
                  <Link
                    key={f.id}
                    href={`/inventory/${f.id}`}
                    className="flex items-center justify-between rounded-lg bg-white border border-red-200 px-3 py-2.5 hover:shadow-sm transition-shadow"
                  >
                    <div className="min-w-0">
                      <p className="text-base font-medium text-foreground truncate">{f.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Reorder point: {f.reorderPoint} kg
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600 tabular-nums">
                          {f.stock.toLocaleString("id-ID")} kg
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
