"use client";

import { DateRangeFilter, type DateRangePreset } from "@/components/filters/date-range-filter";

export type PeriodPreset = "thisMonth" | "lastMonth" | "last3Months" | "custom";

interface PeriodFilterProps {
  preset: PeriodPreset;
  onPresetChange: (preset: PeriodPreset) => void;
  startDate: string;
  endDate: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  isCustom: boolean;
  onReset: () => void;
}

const PRESETS: DateRangePreset[] = [
  { value: "thisMonth", label: "Bulan Ini", start: "2026-08-01", end: "2026-08-31" },
  { value: "lastMonth", label: "Bulan Lalu", start: "2026-07-01", end: "2026-07-31" },
  { value: "last3Months", label: "3 Bulan", start: "2026-06-01", end: "2026-08-31" },
];

export function PeriodFilter({
  preset,
  onPresetChange,
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  isCustom,
  onReset,
}: PeriodFilterProps) {
  return (
    <DateRangeFilter
      compact
      presets={PRESETS}
      preset={preset}
      onPresetChange={(p) => onPresetChange(p as PeriodPreset)}
      startDate={startDate}
      endDate={endDate}
      onStartChange={onStartChange}
      onEndChange={onEndChange}
      placeholder="Rentang Tanggal"
      onClear={isCustom ? onReset : undefined}
    />
  );
}
