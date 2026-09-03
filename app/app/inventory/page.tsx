"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { MenuGuide } from "@/components/tutorial/menu-guide";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FAB } from "@/components/fab";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight, AlertTriangle, Search, Package, MoreVertical, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddFabricPurchaseDialog } from "@/components/dialogs/add-fabric-purchase-dialog";
import { api } from "@/lib/api";
import { FabricCardSkeleton } from "@/components/skeletons";
import { useToast } from "@/components/toast/toast-provider";

interface InventoryColor {
  colorId: string;
  colorName: string;
  stock: number;
  avgPrice: number;
  lastPurchase: string | null;
  isLowStock: boolean;
}

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  reorderPoint: number;
  totalStock: number;
  stock: number; // alias totalStock (backward compat)
  avgPrice: number;
  lastPurchase: string | null;
  colorCount: number;
  isLowStock: boolean;
  colors: InventoryColor[];
}

export default function InventoryPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingFabricId, setDeletingFabricId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const toast = useToast();

  const fetchInventory = () => {
    api
      .get<InventoryItem[]>("/api/inventory")
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleDeleteFabric = async () => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;
    setDeletingFabricId(id);
    try {
      await api.del(`/api/fabrics/${id}`);
      toast.success(`Kain "${name}" berhasil dihapus`);
      setItems((prev) => prev.filter((f) => f.id !== id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(`Gagal hapus kain: ${(err as Error).message}`);
    } finally {
      setDeletingFabricId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.colors.some((c) => c.colorName.toLowerCase().includes(q))
    );
  }, [items, search]);

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      <PageHeader
        title="Inventory"
        subtitle="Stok kain & warna"
        action={<MenuGuide menuKey="inventory" />}
      />

      {/* Error state */}
      {error && !loading && (
        <Card className="bg-red-50 border-red-300 card-shadow-lg mb-4">
          <CardContent className="py-6 text-center">
            <p className="text-base font-semibold text-red-700 mb-1">Gagal memuat data</p>
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Cari nama kain atau warna..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 md:h-10 w-full rounded-lg border border-stone-300 bg-white pl-10 pr-3 text-sm outline-none placeholder:text-stone-400 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 shadow-xs"
        />
      </div>

      {/* Skeleton loading */}
      {loading && (
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <FabricCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {!loading && filtered.length === 0 && !search && (
          <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-lg bg-stone-100 flex items-center justify-center mb-3">
              <Package className="h-6 w-6 text-stone-400" />
            </div>
            <p className="text-base font-semibold text-foreground mb-1">Belum ada stok kain</p>
            <p className="text-sm text-muted-foreground max-w-[220px]">
              Tambah pembelian kain pertama dengan tombol + di bawah
            </p>
          </div>
        )}
        {!loading && filtered.length === 0 && search && (
          <div className="col-span-2 text-center py-8">
            <p className="text-base text-muted-foreground">Tidak ada kain yang cocok dengan &quot;{search}&quot;</p>
          </div>
        )}

        {!loading &&
          filtered.map((fabric) => (
            <Card
              key={fabric.id}
              className={`h-full bg-white border-stone-200 card-shadow-lg transition-all relative ${
                fabric.isLowStock 
                  ? "border-l-4 border-l-red-600" 
                  : "border-l-4 border-l-emerald-500"
              }`}
            >
              <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full">
                {/* Header kartu: Nama kain + titik tiga */}
                <div className="flex items-start justify-between gap-1 mb-2">
                  <Link
                    href={`/inventory/${fabric.id}`}
                    className="min-w-0 flex-1 hover:underline active:opacity-70"
                  >
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-foreground truncate">{fabric.name}</p>
                      {fabric.isLowStock && (
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                          disabled={deletingFabricId === fabric.id}
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/inventory/${fabric.id}`}>
                            Lihat Detail &amp; Warna
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          onClick={() => setDeleteTarget({ id: fabric.id, name: fabric.name })}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Hapus Kain
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Bagian link untuk navigasi detail */}
                <Link
                  href={`/inventory/${fabric.id}`}
                  className="flex flex-col flex-1 justify-between block active:opacity-80"
                >
                  {/* Total stok */}
                  <p
                    className={`text-2xl font-bold mb-0.5 ${
                      fabric.isLowStock ? "text-red-700" : "text-foreground"
                    }`}
                  >
                    {fabric.totalStock} <span className="text-base font-normal">kg</span>
                  </p>

                  {/* Warna chips */}
                  <div className="flex flex-wrap gap-1 mt-2 mb-2 min-h-[20px]">
                    {(fabric.colors ?? []).slice(0, 3).map((c) => (
                      <span
                        key={c.colorId}
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                          c.isLowStock
                            ? "bg-red-50 border-red-200 text-red-700"
                            : "bg-stone-100 border-stone-200 text-stone-600"
                        }`}
                      >
                        {c.colorName} {c.stock}kg
                      </span>
                    ))}
                    {(fabric.colors?.length ?? 0) > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-500">
                        +{fabric.colors.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-stone-100">
                    <p className="text-[10px] text-muted-foreground">
                      {fabric.colorCount} warna
                    </p>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
      </div>

      <FAB onClick={() => setIsDialogOpen(true)} label="Tambah Pembelian Kain" hidden={isDialogOpen} />

      <AddFabricPurchaseDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) fetchInventory();
        }}
      />

      {/* Dialog konfirmasi hapus kain */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Hapus Kain?</DialogTitle>
            <DialogDescription>
              Kain{" "}
              <span className="font-semibold text-foreground">&quot;{deleteTarget?.name}&quot;</span>{" "}
              akan dihapus dari master data. Kain yang sudah digunakan dalam pesanan tidak dapat dihapus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={!!deletingFabricId}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleDeleteFabric}
              disabled={!!deletingFabricId}
            >
              {deletingFabricId ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                  Menghapus...
                </span>
              ) : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
