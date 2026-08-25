"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { fabrics, getFabricStock } from "@/lib/mock-data";

const COLORS = ["#2563eb", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];

/** Komposisi stok kain dalam bentuk donut + legend */
export function StockDonut() {
  const data = fabrics
    .map((f) => ({
      name: f.name,
      value: getFabricStock(f.id),
    }))
    .filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-6">
        Belum ada stok kain
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Donut */}
      <div className="h-28 w-28 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={32}
              outerRadius={52}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="text-[11px] text-muted-foreground truncate flex-1">
              {d.name}
            </span>
            <span className="text-[11px] font-bold text-foreground">
              {d.value.toLocaleString("id-ID")} kg
            </span>
            <span className="text-[10px] text-muted-foreground w-9 text-right">
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-1 border-t border-border/60">
          <span className="text-[11px] font-medium text-muted-foreground">
            Total stok
          </span>
          <span className="text-[11px] font-bold text-foreground">
            {total.toLocaleString("id-ID")} kg
          </span>
        </div>
      </div>
    </div>
  );
}
