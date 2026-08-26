"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { MenuGuide } from "@/components/tutorial/menu-guide";
import { DollarSign, Layers, Trophy } from "lucide-react";
import { api, type Order, type ReportsData } from "@/lib/api";
import { shiftMonth, cn } from "@/lib/utils";
import { PeriodFilter, type PeriodPreset } from "@/components/reports/period-filter";
import { KeuanganView } from "@/components/reports/keuangan-view";
import { ProductionReportView } from "@/components/reports/production-report-view";
import { CustomerView } from "@/components/reports/customer-view";
import { StatusFilter, ORDER_STATUS_OPTIONS } from "@/components/filters/status-filter";

const TABS = [
  { key: "keuangan", label: "Keuangan", icon: DollarSign },
  { key: "produksi", label: "Produksi", icon: Layers },
  { key: "customer", label: "Customer", icon: Trophy },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function getRangeForPreset(preset: PeriodPreset): { start: string; end: string } {
  switch (preset) {
    case "thisMonth":
      return { start: "2026-08-01", end: "2026-08-31" };
    case "lastMonth":
      return { start: "2026-07-01", end: "2026-07-31" };
    case "last3Months":
      return { start: "2026-06-01", end: "2026-08-31" };
    default:
      return { start: "2026-08-01", end: "2026-08-31" };
  }
}

export default function ReportsHubPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [summaries, setSummaries] = useState<ReportsData["summaries"]>([]);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<PeriodPreset>("thisMonth");
  const [tab, setTab] = useState<TabKey>("keuangan");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const initial = getRangeForPreset("thisMonth");
  const [startDate, setStartDate] = useState(initial.start);
  const [endDate, setEndDate] = useState(initial.end);

  useEffect(() => {
    api
      .get<ReportsData>("/api/reports")
      .then((data) => {
        setAllOrders(data.orders);
        setSummaries(data.summaries);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const isCustom = preset === "custom";
  const range = useMemo(
    () => (preset === "custom" ? { start: startDate || "2026-01-01", end: endDate || "2026-12-31" } : getRangeForPreset(preset)),
    [preset, startDate, endDate]
  );
  const prevRange = useMemo(() => ({ start: shiftMonth(range.start, -1), end: shiftMonth(range.end, -1) }), [range]);

  const handlePresetChange = (p: PeriodPreset) => {
    setPreset(p);
    if (p !== "custom") {
      const r = getRangeForPreset(p);
      setStartDate(r.start);
      setEndDate(r.end);
    }
  };
  const handleReset = () => {
    setPreset("thisMonth");
    const r = getRangeForPreset("thisMonth");
    setStartDate(r.start);
    setEndDate(r.end);
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <PageHeader title="Laporan" subtitle="Profit, produksi & customer" action={<MenuGuide menuKey="reports" />} />

      {loading ? (
        <p className="text-center text-sm text-muted-foreground py-8">Memuat...</p>
      ) : (
        <>
          <div className="mb-4">
            <PeriodFilter
              preset={preset}
              onPresetChange={handlePresetChange}
              startDate={startDate}
              endDate={endDate}
              onStartChange={(v) => { setPreset("custom"); setStartDate(v); }}
              onEndChange={(v) => { setPreset("custom"); setEndDate(v); }}
              isCustom={isCustom}
              onReset={handleReset}
            />
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-[11px] text-muted-foreground mb-2">Status</p>
              <StatusFilter
                options={ORDER_STATUS_OPTIONS}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold transition-colors",
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white text-muted-foreground border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {tab === "keuangan" && (
            <KeuanganView orders={allOrders} summaries={summaries} range={range} prevRange={prevRange} statusFilter={statusFilter} />
          )}
          {tab === "produksi" && <ProductionReportView startDate={startDate} endDate={endDate} statusFilter={statusFilter} />}
          {tab === "customer" && <CustomerView orders={allOrders} range={range} statusFilter={statusFilter} />}
        </>
      )}
    </div>
  );
}
