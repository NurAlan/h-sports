"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ArrowLeft } from "lucide-react";
import { PeriodFilter, type PeriodPreset } from "@/components/reports/period-filter";
import { ProductionReportView } from "@/components/reports/production-report-view";

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

export default function ProductionReportPage() {
  const [preset, setPreset] = useState<PeriodPreset>("thisMonth");
  const initial = getRangeForPreset("thisMonth");
  const [startDate, setStartDate] = useState(initial.start);
  const [endDate, setEndDate] = useState(initial.end);
  const isCustom = preset === "custom";

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
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Laporan
      </Link>

      <PageHeader title="Laporan Produksi" subtitle="Pipeline, on-time & progres produksi" />

      <div className="mb-4">
        <PeriodFilter
          preset={preset}
          onPresetChange={handlePresetChange}
          startDate={startDate}
          endDate={endDate}
          onStartChange={(v) => {
            setPreset("custom");
            setStartDate(v);
          }}
          onEndChange={(v) => {
            setPreset("custom");
            setEndDate(v);
          }}
          isCustom={isCustom}
          onReset={handleReset}
        />
      </div>

      <ProductionReportView startDate={startDate} endDate={endDate} />
    </div>
  );
}
