"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { MenuGuide } from "@/components/tutorial/menu-guide";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FAB } from "@/components/fab";
import { api, type Order } from "@/lib/api";
import { OrderCardSkeleton } from "@/components/skeletons";
import { DateRangeFilter } from "@/components/filters/date-range-filter";
import { StatusFilter, ORDER_STATUS_OPTIONS } from "@/components/filters/status-filter";
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
  X,
  Trash2,
} from "lucide-react";
import { CreateOrderDialog } from "@/components/dialogs/create-order-dialog";
import { useToast } from "@/components/toast/toast-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, daysUntil, daysLeftLabel, formatRupiah, profitColor } from "@/lib/utils";

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

// Filter options reuse shared ORDER_STATUS_OPTIONS

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
  const toast = useToast();
  const [orderList, setOrderList] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState<
    "deadline_asc" | "deadline_desc" | "date_desc" | "date_asc"
  >("deadline_asc");
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);

  useEffect(() => {
    api
      .get<Order[]>("/api/orders")
      .then((data) => {
        setOrderList(data);
        setIsLoading(false);
      })
      .catch((e) => {
        toast.error(`Gagal memuat: ${e.message}`);
        setIsLoading(false);
      });
  }, [toast]);

  const filteredOrders = useMemo(() => {
    let result = orderList;

    // 1. Filter by status
    if (filter !== "all") {
      result = result.filter((o) => o.status === filter);
    }

    // 2. Filter by date range (orderDate)
    if (startDate || endDate) {
      result = result.filter((o) => {
        const d = o.orderDate.slice(0, 10);
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
      });
    }

    // 3. Filter by search (nama customer atau nomor order)
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (o) =>
          o.customerName.toLowerCase().includes(q) ||
          o.orderNumber.toLowerCase().includes(q)
      );
    }

    // 4. Sorting
    const sorted = [...result];
    switch (sortBy) {
      case "deadline_asc":
        sorted.sort((a, b) => (a.deadline || "9999-99-99").localeCompare(b.deadline || "9999-99-99"));
        break;
      case "deadline_desc":
        sorted.sort((a, b) => (b.deadline || "9999-99-99").localeCompare(a.deadline || "9999-99-99"));
        break;
      case "date_desc":
        sorted.sort((a, b) => b.orderDate.localeCompare(a.orderDate));
        break;
      case "date_asc":
        sorted.sort((a, b) => a.orderDate.localeCompare(b.orderDate));
        break;
    }
    return sorted;
  }, [filter, startDate, endDate, search, sortBy, orderList]);

  // Count per status untuk badge filter
  const counts = useMemo(() => {
    const acc: Record<string, number> = { all: orderList.length };
    for (const o of orderList) acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, [orderList]);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setOrderList((prev) => prev.filter((o) => o.id !== deleteTarget.id));
    toast.success(`Order ${deleteTarget.orderNumber} dihapus`);
    setDeleteTarget(null);
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <PageHeader title="Orders" subtitle="Kelola pesanan kaos" action={<MenuGuide menuKey="orders" />} />

      {/* 1. Search — paling atas (paling sering dipakai) */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama customer / no. order..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Bersihkan pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort */}
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
            className="h-10 appearance-none rounded-lg border border-gray-300 bg-white pl-8 pr-7 text-xs font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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

      {/* 2. Filter rentang tanggal — di atas status */}
      <div className="mb-3">
        <DateRangeFilter
          compact
          placeholder="Rentang Tanggal"
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
          onClear={() => {
            setStartDate("");
            setEndDate("");
          }}
        />
      </div>

      {/* 3. Filter status — di bawah tanggal */}
      <div className="mb-3">
        <StatusFilter
          options={ORDER_STATUS_OPTIONS.map((o) => ({ ...o, count: counts[o.value] ?? 0 }))}
          value={filter}
          onChange={setFilter}
          showCounts
        />
      </div>

      {/* 4. Result count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">
          Menampilkan{" "}
          <span className="font-semibold text-foreground">
            {filteredOrders.length}
          </span>{" "}
          dari {orderList.length} order
        </p>
        {(search || filter !== "all" || startDate || endDate) && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setFilter("all");
              setStartDate("");
              setEndDate("");
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            Reset filter
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {isLoading && (
          <div className="space-y-4">
            <OrderCardSkeleton />
            <OrderCardSkeleton />
            <OrderCardSkeleton />
          </div>
        )}

        {!isLoading && filteredOrders.map((order) => {
          const config = statusConfig[order.status] || statusConfig.draft;
          const StatusIcon = config.icon;
          const isShipped = order.status === "shipped";
          const days = order.deadline ? daysUntil(order.deadline) : 999;
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
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteTarget(order);
                        }}
                        aria-label={`Hapus ${order.orderNumber}`}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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
                          {order.deadline ? formatDate(order.deadline) : "—"}
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
                          order.costing?.profit == null
                            ? "text-muted-foreground"
                            : profitColor(order.costing.profit)
                        }`}
                      >
                        {order.costing
                          ? formatRupiah(order.costing.profit)
                          : "-"}
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

      <FAB onClick={() => setIsDialogOpen(true)} label="Buat Order Baru" hidden={isDialogOpen} />

      <CreateOrderDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

      {/* Dialog konfirmasi hapus order */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Hapus Order?
            </DialogTitle>
            <DialogDescription>
              Order{" "}
              <span className="font-semibold text-foreground">
                &quot;{deleteTarget?.orderNumber}&quot;
              </span>{" "}
              ({deleteTarget?.customerName}) akan dihapus secara permanen.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-3 text-xs text-red-700">
            Tindakan ini tidak bisa dibatalkan. Data BOM, timeline, dan costing
            yang terkait juga akan terhapus.
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="default"
              onClick={() => setDeleteTarget(null)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={confirmDelete}
            >
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
