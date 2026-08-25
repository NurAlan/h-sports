"use client";

import { CalendarRange, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

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

const PRESETS: Array<{ value: PeriodPreset; label: string }> = [
  { value: "thisMonth", label: "Bulan Ini" },
  { value: "lastMonth", label: "Bulan Lalu" },
  { value: "last3Months", label: "3 Bulan" },
  { value: "custom", label: "Kustom" },
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
    <div>
      {/* Preset chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onPresetChange(p.value)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors",
              preset === p.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white text-muted-foreground border-gray-300 hover:bg-gray-50"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Date range */}
      <div className="flex items-end gap-2.5 mt-2">
        <div className="flex items-center gap-1.5 flex-1">
          <CalendarRange className="h-4 w-4 text-primary shrink-0 mb-3" />
          <div className="flex-1">
            <label className="text-[11px] text-muted-foreground block mb-1">
              Dari
            </label>
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => onStartChange(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <span className="text-muted-foreground text-xs mb-2">s/d</span>
          <div className="flex-1">
            <label className="text-[11px] text-muted-foreground block mb-1">
              Sampai
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => onEndChange(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </div>
        {isCustom && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mb-2 shrink-0"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        )}
      </div>
    </div>
  );
}
