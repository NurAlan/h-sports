import { cn } from "@/lib/utils";

/** Skeleton dasar — animate-pulse, netral */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-muted", className)} />
  );
}

/** Skeleton card order (list orders, production) */
export function OrderCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 card-shadow">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-16 rounded" />
      </div>
      <Skeleton className="h-2 w-full mb-2" />
      <div className="space-y-1.5 mb-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

/** Skeleton card fabric (grid inventory 2 kolom) */
export function FabricCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 h-full card-shadow">
      <div className="flex items-start justify-between mb-2">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-3.5 rounded" />
      </div>
      <Skeleton className="h-7 w-16 mb-1" />
      <Skeleton className="h-3 w-12 mb-3" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  );
}

/** Skeleton stat card (dashboard) */
export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 card-shadow">
      <div className="flex items-center gap-1.5 mb-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-6 w-20 mb-1" />
      <Skeleton className="h-3 w-14" />
    </div>
  );
}

/** Skeleton chart card (dashboard/reports) */
export function ChartCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 card-shadow">
      <Skeleton className="h-4 w-28 mb-3" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

/** Skeleton row item (profile fabrics, list sederhana) */
export function ListItemSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3.5 card-shadow">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-6 w-6 rounded-md" />
        <Skeleton className="h-6 w-6 rounded-md" />
      </div>
    </div>
  );
}

/** Skeleton halaman dashboard lengkap */
export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full rounded-xl" />
      <ChartCardSkeleton />
      <div className="grid grid-cols-2 gap-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <ChartCardSkeleton />
    </div>
  );
}

/** Skeleton halaman reports */
export function ReportsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <ChartCardSkeleton />
      <div className="space-y-2.5">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Skeleton halaman detail */
export function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}
