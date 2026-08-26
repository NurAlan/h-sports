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

/** Pills filter status — wrap responsif, aktif = primary. */
export function StatusFilter({ options, value, onChange, showCounts, className }: StatusFilterProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors",
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white text-muted-foreground border-gray-300 hover:bg-gray-50"
            )}
          >
            {opt.label}
            {showCounts && typeof opt.count === "number" && (
              <span
                className={cn(
                  "text-[10px] font-bold rounded-full px-1.5 py-0.5",
                  active ? "bg-white/20 text-white" : "bg-gray-100 text-muted-foreground"
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
