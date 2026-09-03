import { cn } from "@/lib/utils";

export const ORDER_STATUS_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "draft", label: "Draft" },
  { value: "in_production", label: "Produksi" },
  { value: "qc", label: "QC" },
  { value: "shipped", label: "Selesai" },
] as const;

export type StatusValue = (typeof ORDER_STATUS_OPTIONS)[number]["value"];

interface StatusFilterOption {
  value: string;
  label: string;
  count?: number;
}

interface StatusFilterProps {
  options: readonly StatusFilterOption[];
  value: string;
  onChange: (value: string) => void;
  showCounts?: boolean;
  className?: string;
}

/** Pills filter status — scroll horizontal mulus di mobile tanpa memakan vertikal space */
export function StatusFilter({ options, value, onChange, showCounts, className }: StatusFilterProps) {
  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0", className)}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center gap-1.5 shrink-0 rounded-lg px-4 py-2 min-h-[40px] text-sm font-medium border transition-all duration-150 active:scale-95",
              active
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-white text-muted-foreground border-stone-300 hover:bg-stone-50 hover:text-foreground"
            )}
          >
            {opt.label}
            {showCounts && typeof opt.count === "number" && (
              <span
                className={cn(
                  "text-[10px] font-bold rounded px-1.5 py-0.5 ml-0.5",
                  active ? "bg-white/20 text-white" : "bg-stone-100 text-muted-foreground"
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
