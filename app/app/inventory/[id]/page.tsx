"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
} from "lucide-react";
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
}: {
  color: ColorWithStock;
  onAddStock: () => void;
}) {
  return (
    <div className="px-3 pb-3 space-y-2">
      <div className="flex items-center justify-between pt-1 pb-2 border-t border-gray-200">
        <span className="text-sm text-muted-foreground font-medium">
          Riwayat pembelian
        </span>
        <Button
          size="sm"
          type="button"
          className="h-7 gap-1 bg-white text-primary border border-primary/40 hover:bg-blue-50 shadow-sm text-sm"
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
            className="rounded-xl border border-gray-200 bg-white p-3"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-base font-semibold text-foreground">
                {batch.supplierName || "Tanpa supplier"}
              </p>
              <Badge
                variant="secondary"
                className={`text-[10px] ${
                  batch.qtyRemaining === 0
                    ? "bg-gray-100 text-gray-500"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {batch.qtyRemaining === 0
                  ? "Habis"
                  : `${batch.qtyRemaining} kg sisa`}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
              <span>{formatDate(batch.purchaseDate)}</span>
              <span>•</span>
              <span>Beli: {batch.qtyPurchased} kg</span>
              <span>•</span>
              <span>{formatRupiah(batch.pricePerKg)}/kg</span>
            </div>
            {batch.qtyRemaining > 0 && (
              <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-400 rounded-full"
                  style={{
                    width: `${(batch.qtyRemaining / batch.qtyPurchased) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function ColorAccordionRow({
  color,
  isOpen,
  onToggle,
  onAddStock,
}: {
  color: ColorWithStock;
  isOpen: boolean;
  onToggle: () => void;
  onAddStock: () => void;
}) {
  const remainingPct =
    color.totalPurchased > 0
      ? (color.stock / color.totalPurchased) * 100
      : 0;

  return (
    <div
      className={`rounded-xl border-2 transition-all duration-200 overflow-hidden ${
        isOpen
          ? "border-primary bg-blue-50/60"
          : color.isLowStock
            ? "border-red-300 bg-red-50"
            : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-3"
        aria-expanded={isOpen}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            {color.isLowStock && (
              <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
            )}
            <span className="text-base font-semibold text-foreground">
              {color.colorName}
            </span>
            {color.isLowStock && (
              <Badge
                variant="secondary"
                className="text-[10px] bg-red-100 text-red-700 border-red-200"
              >
                Stok Menipis
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-lg font-bold tabular-nums ${
                color.isLowStock ? "text-red-700" : "text-foreground"
              }`}
            >
              {color.stock} kg
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              color.isLowStock ? "bg-red-500" : "bg-blue-500"
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
      </button>

      {/* Accordion body */}
      {isOpen && <BatchHistory color={color} onAddStock={onAddStock} />}
    </div>
  );
}

function EmptyColorAccordionRow({
  color,
  isOpen,
  onToggle,
  onAddStock,
}: {
  color: ColorWithStock;
  isOpen: boolean;
  onToggle: () => void;
  onAddStock: () => void;
}) {
  return (
    <div
      className={`rounded-xl border-2 transition-all duration-200 overflow-hidden ${
        isOpen
          ? "border-primary bg-blue-50/60"
          : "border-gray-200 bg-gray-50 hover:border-gray-300"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-3"
        aria-expanded={isOpen}
      >
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-muted-foreground">
            {color.colorName}
          </span>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-[10px] bg-gray-200 text-gray-500"
            >
              Habis
            </Badge>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
      </button>

      {isOpen && <BatchHistory color={color} onAddStock={onAddStock} />}
    </div>
  );
}

export default function InventoryDetailPage() {
  const params = useParams();
  const fabricId = params.id as string;

  const [fabric, setFabric] = useState<FabricDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [expandedColorId, setExpandedColorId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<FabricDetail>(`/api/fabrics/${fabricId}`)
      .then((data) => {
        setFabric(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [fabricId]);

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

  const handleDialogSuccess = () => {
    api
      .get<FabricDetail>(`/api/fabrics/${fabricId}`)
      .then(setFabric)
      .catch(() => {});
  };

  const toggleColor = (id: string) => {
    setExpandedColorId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      {/* Top Bar: Back + Guide */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <Link
          href="/inventory"
          className="inline-flex items-center gap-1.5 text-base font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Inventory
        </Link>
        <MenuGuide menuKey="inventory_detail" />
      </div>

      {/* Header card */}
      <Card className="mb-4 card-shadow-lg bg-blue-100 border-2 border-blue-300 hover:shadow-xl hover:-translate-y-0.5 transition-all">
        <CardContent className="pt-4 pb-4">
          <p className="text-xl font-bold text-foreground mb-1">
            {fabric.name}
          </p>
          <div className="flex items-end gap-1 mb-3">
            <p className="text-4xl font-bold text-blue-700 tabular-nums">
              {totalStock}
            </p>
            <p className="text-base text-blue-600 mb-1">kg total</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Boxes className="h-3.5 w-3.5" />
            <span>{activeColors.length} warna tersedia</span>
            <span>•</span>
            <span>Reorder point: {fabric.reorderPoint} kg</span>
          </div>
        </CardContent>
      </Card>

      {/* Stok per warna — accordion */}
      <Card className="mb-4 card-shadow-lg bg-gray-100 border-2 border-gray-300 hover:shadow-xl hover:-translate-y-0.5 transition-all">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Boxes className="h-4 w-4 text-primary" />
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
            />
          ))}

          {/* Empty colors — separate section */}
          {emptyColors.length > 0 && (
            <div className={activeColors.length > 0 ? "pt-1 border-t border-gray-200 space-y-2" : "space-y-2"}>
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
          if (!open) handleDialogSuccess();
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
