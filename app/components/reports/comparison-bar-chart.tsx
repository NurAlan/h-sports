"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";
import type { MonthlySummary } from "@/lib/api";

const formatAxis = (v: number) => `${(v / 1000000).toFixed(1)}jt`;

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-lg text-sm">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-1.5 text-muted-foreground">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: entry.color }}
          />
          {entry.name}:{" "}
          <span className="font-semibold text-foreground">
            {formatAxis(entry.value)}
          </span>
        </p>
      ))}
    </div>
  );
}

/** Bar chart perbandingan Omzet vs HPP per bulan — data dari API */
export function ComparisonBarChart({ data }: { data: MonthlySummary[] }) {
  const chartData = data.map((d) => ({
    month: d.month.slice(5) + "/" + d.month.slice(0, 4).slice(2),
    revenue: d.totalRevenue,
    hpp: d.totalHpp,
  }));

  // Empty state
  if (chartData.length === 0) {
    return (
      <div className="h-52 flex flex-col items-center justify-center text-center px-6">
        <div className="h-10 w-10 rounded-lg bg-stone-100 flex items-center justify-center mb-2.5">
          <BarChart3 className="h-5 w-5 text-gray-400" />
        </div>
        <p className="text-base font-medium text-muted-foreground mb-1">
          Belum ada data omzet
        </p>
        <p className="text-sm text-muted-foreground/70 leading-relaxed">
          Grafik akan muncul setelah order memiliki data costing
        </p>
      </div>
    );
  }

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatAxis}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f3f4f6" }} />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
          <Bar dataKey="revenue" name="Omzet" fill="#2563eb" radius={[4, 4, 0, 0]} />
          <Bar dataKey="hpp" name="HPP" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
