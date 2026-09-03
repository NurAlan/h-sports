"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { PieChart as PieIcon } from "lucide-react";

const COLORS = ["#2563eb", "#22c55e", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

interface StockDonutProps {
  data: { name: string; value: number }[];
}

/** Donut chart komposisi stok per jenis kain — data dari API */
export function StockDonut({ data }: StockDonutProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="py-10 flex flex-col items-center justify-center text-center px-6">
        <div className="h-10 w-10 rounded-lg bg-stone-100 flex items-center justify-center mb-2.5">
          <PieIcon className="h-5 w-5 text-gray-400" />
        </div>
        <p className="text-base font-medium text-muted-foreground mb-1">
          Belum ada stok kain
        </p>
        <p className="text-sm text-muted-foreground/70 leading-relaxed">
          Komposisi stok akan muncul setelah ada pembelian kain
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 space-y-1.5">
        {data.map((d, i) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          return (
            <div key={d.name} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="text-muted-foreground truncate flex-1">{d.name}</span>
              <span className="font-semibold text-foreground">
                {d.value.toLocaleString("id-ID")} kg
              </span>
              <span className="text-muted-foreground w-10 text-right">
                {pct.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
