"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import type { Order } from "@/lib/api";
import { formatRupiah, profitColor, cn } from "@/lib/utils";

interface Range {
  start: string;
  end: string;
}

export function CustomerView({ orders, range, statusFilter = "all" }: { orders: Order[]; range: Range; statusFilter?: string }) {
  const customers = useMemo(() => {
    const inRange = orders.filter(
      (o) => o.orderDate.slice(0, 10) >= range.start && o.orderDate.slice(0, 10) <= range.end
    );
    const filtered = statusFilter && statusFilter !== "all" ? inRange.filter((o) => o.status === statusFilter) : inRange;
    const map = new Map<string, { count: number; revenue: number; profit: number }>();
    for (const o of filtered) {
      const c = o.costing;
      const cur = map.get(o.customerName) ?? { count: 0, revenue: 0, profit: 0 };
      cur.count += 1;
      cur.revenue += c?.sellingPrice ?? 0;
      cur.profit += c?.profit ?? 0;
      map.set(o.customerName, cur);
    }
    const totalProfit = [...map.values()].reduce((s, v) => s + v.profit, 0);
    return [...map.entries()]
      .map(([name, v]) => ({
        name,
        ...v,
        share: totalProfit > 0 ? (v.profit / totalProfit) * 100 : 0,
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [orders, range, statusFilter]);

  const maxProfit = customers.reduce((m, c) => Math.max(m, c.profit), 0);

  return (
    <Card className="card-shadow-lg bg-white border-stone-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          Customer Berdasarkan Profit
          <span className="text-[11px] font-normal text-muted-foreground">
            {customers.length} customer
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {customers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            Belum ada data di periode ini
          </p>
        ) : (
          customers.map((c, i) => (
            <div key={c.name} className="flex items-center gap-3">
              <span
                className={cn(
                  "h-6 w-6 rounded flex items-center justify-center text-[11px] font-bold shrink-0",
                  i === 0 ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-muted-foreground"
                )}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-base font-medium text-foreground truncate">{c.name}</p>
                  <p className={`text-base font-semibold ${profitColor(c.profit)} whitespace-nowrap`}>
                    {formatRupiah(c.profit)}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 flex-1 rounded bg-stone-100 overflow-hidden">
                    <div
                      className="h-full rounded bg-primary"
                      style={{ width: `${maxProfit ? (c.profit / maxProfit) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {c.share.toFixed(1)}% • {c.count} order
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
