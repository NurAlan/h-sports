"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { LineChart as LineChartIcon } from "lucide-react";
import type { MonthlySummary } from "@/lib/api";

const formatRupiahAxis = (v: number) => `${(v / 1000000).toFixed(1)}jt`;
const formatPct = (v: number) => `${v.toFixed(0)}%`;

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string; dataKey?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: entry.color }} />
          {entry.name}:{" "}
          <span className="font-semibold text-foreground">
            {entry.dataKey === "margin"
              ? formatPct(entry.value)
              : `Rp ${Math.round(entry.value).toLocaleString("id-ID")}`}
          </span>
        </p>
      ))}
    </div>
  );
}

/** Tren Profit (area) & Margin % (line) per bulan — dari MonthlySummary. */
export function ProfitTrendChart({ data }: { data: MonthlySummary[] }) {
  const chartData = data.map((d) => ({
    month: `${d.month.slice(5)}/${d.month.slice(0, 4).slice(2)}`,
    profit: Math.round(d.totalProfit),
    margin: Math.round(d.avgMargin),
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-52 flex flex-col items-center justify-center text-center px-6">
        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mb-2.5">
          <LineChartIcon className="h-5 w-5 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-muted-foreground mb-1">Belum ada data profit</p>
        <p className="text-xs text-muted-foreground/70 leading-relaxed">
          Grafik akan muncul setelah order memiliki data costing
        </p>
      </div>
    );
  }

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
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
            yAxisId="profit"
            tick={{ fontSize: 10, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatRupiahAxis}
          />
          <YAxis
            yAxisId="margin"
            orientation="right"
            tick={{ fontSize: 10, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatPct}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f3f4f6" }} />
          <Area
            yAxisId="profit"
            type="monotone"
            dataKey="profit"
            name="Profit"
            stroke="#16a34a"
            strokeWidth={2}
            fill="url(#profitFill)"
          />
          <Line
            yAxisId="margin"
            type="monotone"
            dataKey="margin"
            name="Margin"
            stroke="#7c3aed"
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
