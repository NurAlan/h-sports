"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FAB } from "@/components/fab";
import { AddFabricPurchaseDialog } from "@/components/dialogs/add-fabric-purchase-dialog";
import { DetailSkeleton } from "@/components/skeletons";
import {
  ArrowLeft,
  Boxes,
  AlertTriangle,
  Plus,
  ChevronDown,
  MoreVertical,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/toast/toast-provider";
import { api } from "@/lib/api";
import { formatRupiah, formatDate } from "@/lib/utils";
import { MenuGuide } from "@/components/tutorial/menu-guide";

interface BatchData {
  id: string;
  supplierName: string;
  purchaseDate: string;
  qtyPurchased: number;
  qtyRemaining: number;
  pricePerKg: number;
}

interface ColorData {
  id: string;
  colorName: string;
  isActive: boolean;
  batches: BatchData[];
}

interface FabricDetail {
  id: string;
  name: string;
  unit: string;
  reorderPoint: number;
  colors: ColorData[];
}

interface ColorWithStock extends ColorData {
  stock: number;
  totalPurchased: number;
  avgPrice: number;
  isLowStock: boolean;
}

function BatchHistory({
  color,
  onAddStock,
  onBatchDeleted,
}: {
  color: ColorWithStock;
  onAddStock: () => void;
  onBatchDeleted: () => void;
}) {
  const toast = useToast();
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; info: string } | null>(null);

  const handleDeleteBatch = async () => {
    if (!deleteTarget) return;
    const { id, info } = deleteTarget;
    setDeletingBatchId(id);
    try {
      await api.del(`/api/fabric-batches/${id}`);
      toast.success("Batch berhasil dihapus");
      setDeleteTarget(null);
      onBatchDeleted();
    } catch (err) {
      toast.error(`Gagal hapus batch: ${(err as Error).message}`);
    } finally {
      setDeletingBatchId(null);
    }
  };

  return (
    <div className="px-3 pb-3 space-y-2">
      <div className="flex items-center justify-between pt-1 pb-2 border-t border-stone-200">
        <span className="text-sm text-muted-foreground font-medium">
          Riwayat pembelian
        </span>
        <Button
          size="sm"
          type="button"
          className="h-7 gap-1 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md active:scale-[0.97]"
          onClick={(e) => {
            e.stopPropagation();
            onAddStock();
          }}
        >
          <Plus className="h-3.5 w-3.5" /> Tambah
        </Button>
      </div>
      {color.batches.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2">
          Belum ada riwayat pembelian
        </p>
      ) : (
        color.batches.map((batch) => (
          <div
            key={batch.id}
            className="rounded-lg border border-stone-200 bg-white p-3"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-base font-semibold text-foreground">
                {batch.supplierName || "Tanpa supplier"}
              </p>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`text-[10px] ${
                    batch.qtyRemaining === 0
                      ? "bg-stone-100 text-stone-500"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {batch.qtyRemaining === 0
                    ? "Habis"
                    : `${batch.qtyRemaining} kg sisa`}
                </Badge>

                {/* Delete dropdown menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      disabled={deletingBatchId === batch.id}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      onClick={() =>
                        setDeleteTarget({
                          id: batch.id,
                          info: `${batch.supplierName || "No supplier"} (${formatDate(batch.purchaseDate)})`
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus Batch
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
              <span>{formatDate(batch.purchaseDate)}</span>
              <span>•</span>
              <span>Beli: {batch.qtyPurchased} kg</span>
              <span>•</span>
              <span>{formatRupiah(batch.pricePerKg)}/kg</span>
            </div>
            {batch.qtyRemaining > 0 && (
              <div className="mt-1.5 h-1 bg-stone-100 rounded overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded"
                  style={{
                    width: `${(batch.qtyRemaining / batch.qtyPurchased) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>
        ))
      )}

      {/* Dialog konfirmasi hapus batch */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Hapus Batch?</DialogTitle>
            <DialogDescription>
              Batch <span className="font-semibold text-foreground">{deleteTarget?.info}</span> akan dihapus.
              Batch yang sedang digunakan di pesanan atau produksi tidak dapat dihapus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={!!deletingBatchId}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleDeleteBatch}
              disabled={!!deletingBatchId}
            >
              {deletingBatchId ? (
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

function ColorAccordionRow({
  color,
  isOpen,
  onToggle,
  onAddStock,
  onDeleteColor,
  onBatchDeleted,
}: {
  color: ColorWithStock;
  isOpen: boolean;
  onToggle: () => void;
  onAddStock: () => void;
  onDeleteColor: (colorId: string, colorName: string) => void;
  onBatchDeleted: () => void;
}) {
  const remainingPct =
    color.totalPurchased > 0
      ? (color.stock / color.totalPurchased) * 100
      : 0;

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        isOpen
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : color.isLowStock
            ? "border-red-200 bg-red-50/30"
            : "border-stone-200 bg-white hover:border-stone-300"
      }`}
    >
      {/* Header row — always visible */}
      <div className="flex items-center justify-between p-3 cursor-pointer select-none" onClick={onToggle}>
        <div className="flex items-center gap-2 min-w-0">
          {color.isLowStock && (
            <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
          )}
          <span className="text-base font-semibold text-foreground truncate">
            {color.colorName}
          </span>
          {color.isLowStock && (
            <Badge
              variant="secondary"
              className="text-[10px] bg-red-50 text-red-700 border-red-200"
            >
              Stok Menipis
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`text-lg font-bold tabular-nums ${
              color.isLowStock ? "text-red-700" : "text-foreground"
            }`}
          >
            {color.stock} kg
          </span>

          {/* Color three-dots action */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <DropdownMenuItem
                onClick={() => {
                  onAddStock();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Stok
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={() => onDeleteColor(color.id, color.colorName)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Warna
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Progress bar inside button / row */}
      <div className="px-3 pb-2 cursor-pointer" onClick={onToggle}>
        <div className="h-1.5 bg-stone-200 rounded overflow-hidden">
          <div
            className={`h-full rounded transition-all duration-300 ${
              color.isLowStock ? "bg-red-500" : "bg-teal-600"
            }`}
            style={{ width: `${remainingPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">
            {formatRupiah(Math.round(color.avgPrice))}/kg rata-rata
          </span>
          <span className="text-[10px] text-muted-foreground">
            {remainingPct.toFixed(0)}% dari pembelian
          </span>
        </div>
      </div>

      {/* Accordion body */}
      {isOpen && (
        <BatchHistory
          color={color}
          onAddStock={onAddStock}
          onBatchDeleted={onBatchDeleted}
        />
      )}
    </div>
  );
}

function EmptyColorAccordionRow({
  color,
  isOpen,
  onToggle,
  onAddStock,
  onDeleteColor,
  onBatchDeleted,
}: {
  color: ColorWithStock;
  isOpen: boolean;
  onToggle: () => void;
  onAddStock: () => void;
  onDeleteColor: (colorId: string, colorName: string) => void;
  onBatchDeleted: () => void;
}) {
  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        isOpen
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-stone-200 bg-stone-50/60 hover:border-stone-300"
      }`}
    >
      <div className="flex items-center justify-between p-3 cursor-pointer select-none" onClick={onToggle}>
        <span className="text-base font-semibold text-muted-foreground">
          {color.colorName}
        </span>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="text-[10px] bg-stone-200 text-stone-500"
          >
            Habis
          </Badge>

          {/* Color three-dots action */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onAddStock}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Stok
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={() => onDeleteColor(color.id, color.colorName)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Warna
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {isOpen && (
        <BatchHistory
          color={color}
          onAddStock={onAddStock}
          onBatchDeleted={onBatchDeleted}
        />
      )}
    </div>
  );
}

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fabricId = params.id as string;
  const toast = useToast();

  const [fabric, setFabric] = useState<FabricDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [expandedColorId, setExpandedColorId] = useState<string | null>(null);
  const [deletingFabric, setDeletingFabric] = useState(false);

  const fetchFabricDetail = useCallback(() => {
    api
      .get<FabricDetail>(`/api/fabrics/${fabricId}`)
      .then((data) => {
        setFabric(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [fabricId]);

  useEffect(() => {
    fetchFabricDetail();
  }, [fetchFabricDetail]);

  const handleDeleteFabric = async () => {
    if (!fabric) return;
    if (
      !confirm(
        `Hapus master kain "${fabric.name}"?\n\nKain yang sedang digunakan di pesanan (termasuk Draft) tidak dapat dihapus.`
      )
    ) {
      return;
    }

    setDeletingFabric(true);
    try {
      await api.del(`/api/fabrics/${fabricId}`);
      toast.success(`Kain "${fabric.name}" berhasil dihapus`);
      router.push("/inventory");
    } catch (err) {
      toast.error(`Gagal hapus kain: ${(err as Error).message}`);
    } finally {
      setDeletingFabric(false);
    }
  };

  const handleDeleteColor = async (colorId: string, colorName: string) => {
    if (
      !confirm(
        `Hapus warna "${colorName}" dari kain ini?\n\nWarna yang sedang digunakan di pesanan (termasuk Draft) tidak dapat dihapus.`
      )
    ) {
      return;
    }

    try {
      await api.del(`/api/fabrics/${fabricId}/colors/${colorId}`);
      toast.success(`Warna "${colorName}" berhasil dihapus`);
      fetchFabricDetail();
    } catch (err) {
      toast.error(`Gagal hapus warna: ${(err as Error).message}`);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (!fabric) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6 text-center">
        <p className="text-muted-foreground">Kain tidak ditemukan</p>
        <Link
          href="/inventory"
          className="text-primary text-base hover:underline"
        >
          ← Kembali ke Inventory
        </Link>
      </div>
    );
  }

  // Aggregate stok per warna dari batches
  const colorsWithStock: ColorWithStock[] = fabric.colors.map((c) => {
    const stock = c.batches.reduce((s, b) => s + b.qtyRemaining, 0);
    const totalPurchased = c.batches.reduce((s, b) => s + b.qtyPurchased, 0);
    const totalValue = c.batches.reduce(
      (s, b) => s + b.qtyRemaining * b.pricePerKg,
      0
    );
    const avgPrice = stock > 0 ? totalValue / stock : 0;
    return {
      ...c,
      stock: Math.round(stock * 10) / 10,
      totalPurchased: Math.round(totalPurchased * 10) / 10,
      avgPrice,
      isLowStock: stock > 0 && stock <= fabric.reorderPoint,
    };
  });

  const activeColors = colorsWithStock.filter((c) => c.stock > 0);
  const emptyColors = colorsWithStock.filter((c) => c.stock === 0);
  const totalStock = activeColors.reduce((s, c) => s + c.stock, 0);

  // The expanded color is used to prefill the AddFabricPurchaseDialog
  const expandedColor = colorsWithStock.find((c) => c.id === expandedColorId);

  const toggleColor = (id: string) => {
    setExpandedColorId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      {/* Top Bar: Back + Guide + Delete Fabric Menu */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <Link
          href="/inventory"
          className="inline-flex items-center gap-1.5 text-base font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Inventory
        </Link>
        <div className="flex items-center gap-1">
          <MenuGuide menuKey="inventory_detail" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                disabled={deletingFabric}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={handleDeleteFabric}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Kain
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Header card */}
      <Card className="mb-4 card-shadow bg-white border border-stone-200 transition-all">
        <CardContent className="pt-5 pb-5">
          <p className="text-xl font-bold text-foreground mb-1">
            {fabric.name}
          </p>
          <div className="flex items-end gap-1 mb-3">
            <p className="text-4xl font-bold text-teal-700 tabular-nums">
              {totalStock}
            </p>
            <p className="text-sm font-medium text-muted-foreground mb-1">kg total</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Boxes className="h-3.5 w-3.5 text-stone-400" />
            <span>{activeColors.length} warna tersedia</span>
            <span>•</span>
            <span>Reorder point: {fabric.reorderPoint} kg</span>
          </div>
        </CardContent>
      </Card>

      {/* Stok per warna — accordion */}
      <Card className="mb-4 card-shadow bg-white border border-stone-200 transition-all">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Boxes className="h-4 w-4 text-teal-700" />
            Stok per Warna
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {colorsWithStock.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada warna — tambah pembelian pertama lewat tombol + di bawah
            </p>
          )}

          {/* Active colors */}
          {activeColors.map((color) => (
            <ColorAccordionRow
              key={color.id}
              color={color}
              isOpen={expandedColorId === color.id}
              onToggle={() => toggleColor(color.id)}
              onAddStock={() => {
                setExpandedColorId(color.id);
                setIsAddStockOpen(true);
              }}
              onDeleteColor={handleDeleteColor}
              onBatchDeleted={fetchFabricDetail}
            />
          ))}

          {/* Empty colors — separate section */}
          {emptyColors.length > 0 && (
            <div className={activeColors.length > 0 ? "pt-1 border-t border-stone-200 space-y-2" : "space-y-2"}>
              {activeColors.length > 0 && (
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide pt-1">
                  Stok habis
                </p>
              )}
              {emptyColors.map((color) => (
                <EmptyColorAccordionRow
                  key={color.id}
                  color={color}
                  isOpen={expandedColorId === color.id}
                  onToggle={() => toggleColor(color.id)}
                  onAddStock={() => {
                    setExpandedColorId(color.id);
                    setIsAddStockOpen(true);
                  }}
                  onDeleteColor={handleDeleteColor}
                  onBatchDeleted={fetchFabricDetail}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAB */}
      <FAB
        onClick={() => setIsAddStockOpen(true)}
        label="Tambah Stok"
        hidden={isAddStockOpen}
      />

      {/* Dialog tambah stok — prefill fabric + warna terpilih */}
      <AddFabricPurchaseDialog
        open={isAddStockOpen}
        onOpenChange={(open) => {
          setIsAddStockOpen(open);
          if (!open) fetchFabricDetail();
        }}
        initialFabricId={fabric.id}
        initialColorName={expandedColor?.colorName}
        initialPricePerKg={
          expandedColor ? Math.round(expandedColor.avgPrice) : undefined
        }
      />
    </div>
  );
}
