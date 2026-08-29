"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { MenuGuide } from "@/components/tutorial/menu-guide";
import {
  ClipboardList,
  Wrench,
  CalendarClock,
  AlertTriangle,
  FileText,
  ChevronRight,
} from "lucide-react";
import { DashboardSkeleton } from "@/components/skeletons";
import { api, type DashboardData } from "@/lib/api";

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
    <Link href={href} className="h-full">
      <Card className={`h-full card-shadow-lg border-2 transition-all hover:shadow-xl hover:-translate-y-0.5 ${colorClass}`}>
        <CardContent className="pt-4 pb-4 flex flex-col">
          <div className={`inline-flex items-center justify-center h-9 w-9 rounded-xl mb-3 ${iconColorClass}`}>
            {icon}
          </div>
          <p className="text-3xl font-bold tabular-nums mb-0.5">{count}</p>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 min-h-[14px]">{sublabel ?? ""}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DashboardData>("/api/dashboard")
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <PageHeader
        title="Dashboard"
        subtitle="Ringkasan status order"
        action={<MenuGuide menuKey="dashboard" />}
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
