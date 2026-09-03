"use client";

import { useState } from "react";
import { Calendar, ChevronDown, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DateRangePreset {
  value: string;
  label: string;
  start: string;
  end: string;
}

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  presets?: DateRangePreset[];
  preset?: string;
  onPresetChange?: (p: string) => void;
  placeholder?: string;
  onClear?: () => void;
  compact?: boolean;
  className?: string;
}

function shortDate(d: string) {
  if (!d) return "";
  const [, m, day] = d.split("-");
  return `${Number(day)}/${Number(m)}`;
}

function rangeLabel(start: string, end: string) {
  if (start && end) return `${shortDate(start)} – ${shortDate(end)}`;
  if (start) return `≥ ${shortDate(start)}`;
  if (end) return `≤ ${shortDate(end)}`;
  return "";
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  presets,
  preset,
  onPresetChange,
  placeholder = "Rentang Tanggal",
  onClear,
  compact,
  className,
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);

  const hasPresetSelection = !!presets && !!preset && preset !== "custom";
  const hasValue = hasPresetSelection || !!(startDate || endDate);
  const presetLabel = presets?.find((p) => p.value === preset)?.label;
  const display = hasPresetSelection && presetLabel ? presetLabel : rangeLabel(startDate, endDate) || placeholder;

  const pickPreset = (p: DateRangePreset) => {
    onPresetChange?.(p.value);
    onStartChange(p.start);
    onEndChange(p.end);
    setOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 w-full rounded-lg border bg-white text-left transition-colors",
          compact ? "h-9 px-3 text-sm" : "h-10 px-3 text-base",
          hasValue ? "border-primary text-foreground" : "border-stone-300 text-muted-foreground"
        )}
      >
        <Calendar className={cn("h-4 w-4 shrink-0", hasValue ? "text-primary" : "text-muted-foreground")} />
        <span className="flex-1 truncate font-medium">{display}</span>
        {hasValue && onClear && (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Hapus filter tanggal"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 z-50 mt-1.5 rounded-lg border border-stone-200 bg-white p-3 shadow-lg card-shadow-lg">
            {presets && presets.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {presets.map((p) => {
                  const active = preset === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => pickPreset(p)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-sm font-medium border transition-colors",
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-white text-muted-foreground border-stone-300 hover:bg-stone-50"
                      )}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            )}

            <div className={cn("flex flex-col sm:flex-row sm:items-end", compact ? "gap-1.5" : "gap-2")}>
              <div className="flex-1 min-w-0">
                <label className="text-[11px] text-muted-foreground block mb-0.5">Dari</label>
                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => onStartChange(e.target.value)}
                  className={cn(
                    "w-full rounded-lg border border-stone-300 bg-white px-2.5 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
                    compact ? "h-8 text-sm" : "h-9 text-base"
                  )}
                />
              </div>
              <span className={cn("hidden sm:block text-muted-foreground", compact ? "text-[11px] pb-2" : "text-sm pb-2.5")}>
                s/d
              </span>
              <div className="flex-1 min-w-0">
                <label className="text-[11px] text-muted-foreground block mb-0.5">Sampai</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => onEndChange(e.target.value)}
                  className={cn(
                    "w-full rounded-lg border border-stone-300 bg-white px-2.5 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
                    compact ? "h-8 text-sm" : "h-9 text-base"
                  )}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              {onClear ? (
                <button
                  type="button"
                  onClick={() => {
                    onClear();
                    setOpen(false);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
              >
                Selesai
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
