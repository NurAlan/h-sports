"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FAB } from "@/components/fab";
import {
  Package,
  FileText,
  Wrench,
  CheckCircle2,
  Truck,
  ChevronRight,
  CalendarClock,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { CreateOrderDialog } from "@/components/dialogs/create-order-dialog";
import { orders } from "@/lib/mock-data";
import { formatDate, daysUntil, daysLeftLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  string,
  {
    label: string;
    badgeClass: string;
    icon: typeof Package;
    iconClass: string;
    textClass: string;
  }
> = {
  draft: {
    label: "Draft",
    badgeClass: "bg-gray-300 text-gray-800",
    icon: FileText,
    iconClass: "bg-gray-400 text-white",
    textClass: "text-gray-700",
  },
  in_production: {
    label: "Produksi",
    badgeClass: "bg-blue-200 text-blue-800",
    icon: Wrench,
    iconClass: "bg-blue-500 text-white",
    textClass: "text-blue-700",
  },
  qc: {
    label: "QC",
    badgeClass: "bg-amber-200 text-amber-800",
    icon: CheckCircle2,
    iconClass: "bg-amber-500 text-white",
    textClass: "text-amber-700",
  },
  shipped: {
    label: "Selesai",
    badgeClass: "bg-green-200 text-green-800",
    icon: Truck,
    iconClass: "bg-green-500 text-white",
    textClass: "text-green-700",
  },
};

// Filter options
const filterOptions = [
  { value: "all", label: "Semua" },
  { value: "draft", label: "Draft" },
  { value: "in_production", label: "Produksi" },
  { value: "qc", label: "QC" },
  { value: "shipped", label: "Selesai" },
] as const;

type FilterValue = (typeof filterOptions)[number]["value"];

/** Warna card berdasarkan deadline:
 *  - Shipped/selesai : hijau
 *  - Melewati deadline: merah gelap
 *  - Deadline <= 1 hari : merah
 *  - Deadline < 3 hari : oranye
 *  - Aman : abu-abu
 */
function getDeadlineCardClass(days: number, isShipped: boolean) {
  if (isShipped) return "bg-green-100 border-green-300";
  if (days < 0) return "bg-red-300 border-red-500";
  if (days <= 1) return "bg-red-100 border-red-300";
  if (days < 3) return "bg-orange-100 border-orange-300";
  return "bg-gray-200 border-gray-300";
}

function getDeadlineBadgeClass(days: number, isShipped: boolean) {
  if (isShipped) return "bg-green-200 text-green-800";
  if (days < 0) return "bg-red-700 text-white";
  if (days <= 1) return "bg-red-500 text-white";
  if (days < 3) return "bg-orange-500 text-white";
  return "bg-gray-200 text-gray-700";
}

export default function OrdersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<
    "deadline_asc" | "deadline_desc" | "date_desc" | "date_asc"
  >("deadline_asc");

  const filteredOrders = useMemo(() => {
    let result = orders;

    // 1. Filter by status
    if (filter !== "all") {
      result = result.filter((o) => o.status === filter);
    }

    // 2. Filter by search (nama customer atau nomor order)
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (o) =>
          o.customerName.toLowerCase().includes(q) ||
          o.orderNumber.toLowerCase().includes(q)
      );
    }

    // 3. Sorting
    const sorted = [...result];
    switch (sortBy) {
      case "deadline_asc":
        sorted.sort((a, b) => a.deadline.localeCompare(b.deadline));
        break;
      case "deadline_desc":
        sorted.sort((a, b) => b.deadline.localeCompare(a.deadline));
        break;
      case "date_desc":
        sorted.sort((a, b) => b.orderDate.localeCompare(a.orderDate));
        break;
      case "date_asc":
        sorted.sort((a, b) => a.orderDate.localeCompare(b.orderDate));
        break;
    }
    return sorted;
  }, [filter, search, sortBy]);

  // Count per status untuk badge filter
  const counts = useMemo(() => {
    const acc: Record<string, number> = { all: orders.length };
    for (const o of orders) acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, []);

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <PageHeader title="Orders" subtitle="Daftar pesanan kaos" />

      {/* Filter status */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilter(opt.value)}
            className={cn(
              "flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors",
              filter === opt.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white text-muted-foreground border-gray-300 hover:bg-gray-50"
            )}
          >
            {opt.label}
            <span
              className={cn(
                "text-[10px] font-bold rounded-full px-1.5 py-0.5",
                filter === opt.value
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-muted-foreground"
              )}
            >
              {counts[opt.value] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex items-center gap-2 mb-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama customer / no. order..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        {/* Sort select */}
        <div className="relative shrink-0">
          <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value as
                  | "deadline_asc"
                  | "deadline_desc"
                  | "date_desc"
                  | "date_asc"
              )
            }
            className="h-9 appearance-none rounded-lg border border-gray-300 bg-white pl-8 pr-7 text-xs font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="deadline_asc">Deadline ↑</option>
            <option value="deadline_desc">Deadline ↓</option>
            <option value="date_desc">Terbaru</option>
            <option value="date_asc">Terlama</option>
          </select>
          <svg
            className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {filteredOrders.map((order) => {
          const config = statusConfig[order.status] || statusConfig.draft;
          const StatusIcon = config.icon;
          const isShipped = order.status === "shipped";
          const days = daysUntil(order.deadline);
          const cardClass = getDeadlineCardClass(days, isShipped);
          const badgeClass = getDeadlineBadgeClass(days, isShipped);

          return (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card
                className={`border card-shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all ${cardClass}`}
              >
                <CardContent className="pt-3.5 pb-3 px-4">
                  {/* Top row — compact */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <p className="text-[13px] font-bold text-foreground">
                          {order.orderNumber}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0 ${config.badgeClass}`}
                        >
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {order.customerName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div
                        className={`${config.iconClass} p-1.5 rounded-lg shadow-sm`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Bottom row — compact */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground min-w-0">
                      <span className="flex items-center gap-0.5 shrink-0">
                        <Package className="h-3 w-3" />
                        {order.qtyItems} pcs
                      </span>
                      <span className="flex items-center gap-0.5 min-w-0">
                        <CalendarClock className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {formatDate(order.deadline)}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-[9px] px-1 py-0 shrink-0 ${badgeClass}`}
                        >
                          {isShipped ? "Selesai" : daysLeftLabel(days)}
                        </Badge>
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-muted-foreground leading-none">
                        Profit
                      </p>
                      <p
                        className={`text-xs font-bold ${
                          order.profit === "-"
                            ? "text-muted-foreground"
                            : "text-green-600"
                        }`}
                      >
                        {order.profit}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}

        {filteredOrders.length === 0 && (
          <Card className="bg-white border-gray-300 card-shadow-lg">
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {search
                  ? `Tidak ada hasil untuk "${search}"`
                  : "Tidak ada order dengan filter ini"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <FAB onClick={() => setIsDialogOpen(true)} label="Buat Order Baru" />

      <CreateOrderDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
