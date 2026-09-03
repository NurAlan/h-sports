"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { MenuGuide } from "@/components/tutorial/menu-guide";
import { GlobalTourDialog } from "@/components/tutorial/global-tour-dialog";
import {
  TrendingUp,
  DollarSign,
  Package,
  Wrench,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  X,
  AlertCircle,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { DashboardSkeleton } from "@/components/skeletons";
import { api, type DashboardData } from "@/lib/api";
import {
  getHasSeenTour,
  getIsBannerDismissed,
  setBannerDismissed,
} from "@/lib/tutorial-storage";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatShortRupiah(amount: number): string {
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)} jt`;
  }
  return formatRupiah(amount);
}

function ProgressBar({ percent, className = "" }: { percent: number; className?: string }) {
  return (
    <div className={`h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-slate-600 to-slate-700 rounded-full transition-all duration-500 ease-out shadow-sm"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tourOpen, setTourOpen] = useState(false);
  const [bannerDismissed, setBannerDismissedState] = useState(true);

  useEffect(() => {
    api
      .get<DashboardData>("/api/dashboard")
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Gagal memuat data");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const hasSeenTour = getHasSeenTour();
    const isBannerDismissed = getIsBannerDismissed();
    setBannerDismissedState(isBannerDismissed);

    if (!hasSeenTour && !isBannerDismissed) {
      const timer = setTimeout(() => setTourOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    setBannerDismissedState(true);
  };

  if (loading) return <DashboardSkeleton />;
  if (error) {
    return (
      <div className="p-4">
        <PageHeader title="Dashboard" />
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-3xl text-red-800">
          {error}
        </div>
      </div>
    );
  }
  if (!data) return null;

  const currentMonth = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="pb-20 sm:pb-6 bg-stone-50 min-h-screen">
      <div className="bg-white border-b border-stone-200">
        <div className="p-4">
          <PageHeader 
            title="Dashboard" 
            subtitle={currentMonth}
            action={<MenuGuide menuKey="dashboard" />}
          />
        </div>
      </div>

      {/* Banner panduan */}
      {!bannerDismissed && (
        <div className="px-4 pt-4">
          <Card className="border-0 bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 overflow-hidden shadow-md rounded-xl">
            <CardContent className="py-2 px-3">
              <div className="flex items-center gap-2.5">
                <div className="bg-white/20 backdrop-blur-sm text-white p-1.5 rounded-lg shrink-0">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white">
                    Panduan Sistem H-Sport
                  </p>
                </div>
                <button
                  onClick={() => setTourOpen(true)}
                  className="text-xs font-bold text-blue-600 bg-white hover:bg-blue-50 shrink-0 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Mulai
                </button>
                <button
                  onClick={handleDismissBanner}
                  className="p-1 hover:bg-white/20 rounded-lg shrink-0 transition-colors"
                  aria-label="Tutup"
                >
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* 1. KONDISI BISNIS - Hero metrics */}
        <div className="space-y-3">
          {/* Primary metrics - Large cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-0 bg-white shadow-sm rounded-2xl">
              <CardContent className="p-5">
                <p className="text-xs font-semibold text-stone-600 mb-3 uppercase tracking-wide">Pendapatan</p>
                <p className="text-3xl font-bold text-stone-900 tabular-nums mb-1">
                  {formatShortRupiah(data.financial.revenue)}
                </p>
                <p className="text-xs text-stone-500">{data.financial.orderCount} order</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm rounded-2xl">
              <CardContent className="p-5">
                <p className="text-xs font-semibold text-emerald-50 mb-3 uppercase tracking-wide">Laba Bersih</p>
                <p className="text-3xl font-bold text-white tabular-nums mb-1">
                  {formatShortRupiah(data.financial.profit)}
                </p>
                <p className="text-xs text-emerald-50">
                  {data.financial.margin.toFixed(1)}% margin
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status Produksi - Clean visual */}
          <Card className="border-0 bg-white shadow-sm rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-stone-900 mb-0.5">
                    Status Produksi
                  </p>
                  <p className="text-xs text-stone-600">
                    {data.orderStats.running} order aktif
                  </p>
                </div>
                <div className="bg-blue-50 p-2 rounded-xl">
                  <Wrench className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              
              {/* Clean progress visualization */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          data.orderStats.running > 0
                            ? ((data.orderStats.running -
                                data.orderStats.upcomingDeadline -
                                data.orderStats.overdue) /
                                data.orderStats.running) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-stone-700 tabular-nums w-10 text-right">
                    {data.orderStats.running > 0
                      ? Math.round(
                          ((data.orderStats.running -
                            data.orderStats.upcomingDeadline -
                            data.orderStats.overdue) /
                            data.orderStats.running) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>

                {/* Status breakdown */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-4">
                    {data.orderStats.upcomingDeadline > 0 && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {data.orderStats.upcomingDeadline} mendekat
                      </span>
                    )}
                    {data.orderStats.overdue > 0 && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {data.orderStats.overdue} terlambat
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 2. PERLU PERHATIAN - dengan animasi menonjol */}
        {data.needAttention.length > 0 && (
          <Card className="border-0 bg-white shadow-lg rounded-2xl relative overflow-hidden animate-attention-pulse">
            {/* Animated gradient border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-200 via-orange-200 to-amber-200 animate-gradient-shift pointer-events-none opacity-50" />
            <div className="absolute inset-[2px] bg-white rounded-2xl z-0" />
            
            <CardHeader className="pb-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2.5 rounded-2xl relative animate-bounce-slow">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  {/* Ping animation ring */}
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-stone-900">
                    Perlu Perhatian
                  </CardTitle>
                  <p className="text-xs text-stone-600 mt-0.5">
                    {data.needAttention.length} order memerlukan tindakan
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 relative z-10">
              {data.needAttention.slice(0, 3).map((alert, index) => (
                <Link
                  key={alert.id}
                  href={`/orders/${alert.id}`}
                  className="block p-4 bg-amber-50/50 border border-amber-200 rounded-xl hover:bg-amber-100 hover:border-amber-400 hover:shadow-md transition-all active:scale-[0.99] animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-stone-900 truncate mb-0.5">
                        {alert.customerName}
                      </p>
                      <p className="text-xs text-stone-600 truncate">
                        {alert.orderNumber}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 ${
                        alert.severity === "overdue"
                          ? "bg-red-500 text-white animate-pulse shadow-md"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {alert.issue}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-600">
                    {alert.currentStage && (
                      <span className="flex items-center gap-1.5">
                        <Wrench className="h-3.5 w-3.5" />
                        {alert.currentStage}
                      </span>
                    )}
                    {alert.deadline && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {alert.daysToDeadline !== null &&
                          (alert.daysToDeadline >= 0
                            ? `${alert.daysToDeadline} hari lagi`
                            : `Terlambat ${Math.abs(alert.daysToDeadline)} hari`)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
              {data.needAttention.length > 3 && (
                <Link
                  href="/orders"
                  className="block text-center py-2.5 text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors"
                >
                  Lihat semua ({data.needAttention.length})
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* 3. PROGRESS PRODUKSI */}
        {data.productionProgress.length > 0 && (
          <Card className="border-0 bg-white shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="bg-purple-50 p-2.5 rounded-2xl">
                  <Wrench className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-stone-900">
                    Progress Produksi
                  </CardTitle>
                  <p className="text-xs text-stone-600 mt-0.5">
                    {data.productionProgress.length} order berjalan
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.productionProgress.slice(0, 3).map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block p-4 bg-stone-50 border border-stone-200 rounded-xl hover:bg-stone-100 hover:border-stone-300 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-stone-900 truncate mb-0.5">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-stone-600">{order.orderNumber}</p>
                    </div>
                    <span className="text-base font-bold text-blue-600 tabular-nums shrink-0">
                      {order.progressPct}%
                    </span>
                  </div>
                  <div className="h-2 bg-stone-200 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${order.progressPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-stone-600">
                    {order.currentStage || "Menunggu"} • {order.stagesCompleted}/
                    {order.stagesTotal} tahap
                  </p>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 4. KEUANGAN */}
        <Card className="border-0 bg-white shadow-sm rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 p-2.5 rounded-2xl">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <CardTitle className="text-sm font-bold text-stone-900">
                Keuangan Bulan Ini
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs font-medium text-stone-600">Pendapatan</span>
              <span className="text-sm font-bold text-stone-900 tabular-nums">
                {formatRupiah(data.financial.revenue)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-t border-stone-100">
              <span className="text-xs font-medium text-stone-600">Modal Produksi</span>
              <span className="text-sm font-bold text-red-600 tabular-nums">
                {formatRupiah(data.financial.hpp)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 bg-emerald-50 rounded-xl px-4 border-t border-stone-100">
              <span className="text-xs font-bold text-emerald-900">Laba Bersih</span>
              <span className="text-base font-bold text-emerald-600 tabular-nums">
                {formatRupiah(data.financial.profit)}
              </span>
            </div>
            {data.financial.revenue > 0 && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-medium text-stone-600">Margin</span>
                <span className="text-sm font-bold text-stone-700 tabular-nums">
                  {data.financial.margin.toFixed(1)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 5. INVENTORY ALERT */}
        {data.lowStock.length > 0 && (
          <Card className="border-0 bg-white shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="bg-red-50 p-2.5 rounded-2xl">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-stone-900">
                    Stok Menipis
                  </CardTitle>
                  <p className="text-xs text-stone-600 mt-0.5">
                    {data.lowStock.length} item perlu restok
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.lowStock.map((f) => (
                <Link
                  key={f.id}
                  href={`/inventory/${f.id}`}
                  className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all active:scale-[0.99]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-stone-900 truncate mb-0.5">
                      {f.name}
                    </p>
                    <p className="text-xs text-stone-600">
                      Minimum: {f.reorderPoint} kg
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-base font-bold text-red-600 tabular-nums">
                        {f.stock.toLocaleString("id-ID")} kg
                      </p>
                      <p className="text-xs text-stone-600">tersisa</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-stone-400" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/orders"
            className="flex items-center justify-center gap-2 p-4 bg-blue-600 border-0 rounded-2xl hover:bg-blue-700 transition-all active:scale-[0.98] shadow-sm"
          >
            <Package className="h-4 w-4 text-white" />
            <span className="text-sm font-bold text-white">Lihat Order</span>
          </Link>
          <Link
            href="/inventory"
            className="flex items-center justify-center gap-2 p-4 bg-white border-2 border-stone-300 rounded-2xl hover:bg-stone-50 hover:border-blue-600 transition-all active:scale-[0.98]"
          >
            <TrendingUp className="h-4 w-4 text-stone-700" />
            <span className="text-sm font-bold text-stone-900">Inventory</span>
          </Link>
        </div>
      </div>

      <GlobalTourDialog open={tourOpen} onOpenChange={setTourOpen} />
    </div>
  );
}
