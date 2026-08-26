"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs">
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

/** Area chart omzet vs profit — data dari API (monthly_summaries) */
export function RevenueChart({ data }: { data: MonthlySummary[] }) {
  const chartData = data.map((d) => ({
    month: d.month.slice(5) + "/" + d.month.slice(0, 4).slice(2),
    revenue: d.totalRevenue,
    profit: d.totalProfit,
  }));

  // Empty state — belum ada data omzet
  if (chartData.length === 0) {
    return (
      <div className="h-52 flex flex-col items-center justify-center text-center px-6">
        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mb-2.5">
          <BarChart3 className="h-5 w-5 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Belum ada data omzet
        </p>
        <p className="text-xs text-muted-foreground/70 leading-relaxed">
          Grafik akan muncul setelah order memiliki data costing
        </p>
      </div>
    );
  }

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
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
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Omzet"
            stroke="#2563eb"
            strokeWidth={2}
            fill="url(#revGrad)"
          />
          <Area
            type="monotone"
            dataKey="profit"
            name="Profit"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#profitGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
