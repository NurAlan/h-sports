"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  getOrderById,
  getBOMForOrder,
  getTimelineForOrder,
  getCostingForOrder,
} from "@/lib/mock-data";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Package,
  Layers,
  Clock,
  DollarSign,
  Plus,
  CheckCircle2,
  Circle,
  TrendingUp,
} from "lucide-react";
import { AddBOMItemDialog } from "@/components/dialogs/add-bom-item-dialog";
import { UpdateTimelineDialog } from "@/components/dialogs/update-timeline-dialog";
import { CostingCalculatorDialog } from "@/components/dialogs/costing-calculator-dialog";

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-700" },
  in_production: { label: "Produksi", className: "bg-blue-100 text-blue-700" },
  qc: { label: "QC", className: "bg-amber-100 text-amber-700" },
  shipped: { label: "Terkirim", className: "bg-green-100 text-green-700" },
};

function getStageIcon(status: string) {
  switch (status) {
    case "completed": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "in_progress": return <Clock className="h-4 w-4 text-blue-600" />;
    default: return <Circle className="h-4 w-4 text-gray-300" />;
  }
}

function getStageBadge(status: string) {
  const variants: Record<string, { label: string; className: string }> = {
    completed: { label: "Selesai", className: "bg-green-100 text-green-700" },
    in_progress: { label: "Sedang Dikerjakan", className: "bg-blue-100 text-blue-700" },
    not_started: { label: "Belum Dimulai", className: "bg-gray-100 text-gray-600" },
  };
  const config = variants[status] || { label: status, className: "" };
  return <Badge variant="secondary" className={`text-xs ${config.className}`}>{config.label}</Badge>;
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const order = getOrderById(params.id);
  const status = order ? statusConfig[order.status] || statusConfig.draft : null;

  const [bomOpen, setBomOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [costingOpen, setCostingOpen] = useState(false);

  if (!order || !status) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6 text-center">
        <p className="text-muted-foreground">Order tidak ditemukan</p>
        <Link href="/orders" className="text-primary text-sm hover:underline">← Kembali ke Orders</Link>
      </div>
    );
  }

  const bom = getBOMForOrder(order.id);
  const timeline = getTimelineForOrder(order.id);
  const costing = getCostingForOrder(order.id);

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      {/* Back */}
      <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mb-4">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Orders
      </Link>

      {/* Header Order */}
      <Card className="mb-4 card-shadow-lg bg-white border-gray-300">
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-lg font-bold text-foreground">{order.orderNumber}</p>
            <Badge variant="secondary" className={status.className}>{status.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{order.customerName}</p>
          {order.customerContact && (
            <p className="text-xs text-muted-foreground mb-1">{order.customerContact}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {order.qtyItems} pcs</span>
            <span>{formatDate(order.orderDate)}</span>
          </div>
          {order.specification && (
            <div className="mt-3 pt-3 border-t border-border/60">
              <p className="text-xs font-medium text-muted-foreground mb-1">Spesifikasi:</p>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{order.specification}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 1. BOM — Komposisi Bahan */}
      <Card className="mb-4 card-shadow-lg bg-white border-gray-300">
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Komposisi Bahan
          </CardTitle>
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => setBomOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Tambah
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {bom.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada bahan — klik Tambah untuk mulai</p>
          )}
          {bom.map((item) => (
            <div key={item.id} className="pb-3 border-b border-border/60 last:border-0 last:pb-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-foreground">{item.fabricName}</p>
                <p className="text-sm font-bold">{formatRupiah(item.materialCost)}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{item.qtyRequired} kg bersih</span>
                <span>Waste: {item.wastePercentage}%</span>
                <span>Pakai: {item.qtyActual} kg</span>
              </div>
              <p className="text-xs text-muted-foreground">{formatRupiah(item.pricePerKg)}/kg</p>
            </div>
          ))}
          {bom.length > 0 && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-sm font-semibold text-foreground">Total Material Cost</p>
              <p className="text-sm font-bold text-primary">
                {formatRupiah(bom.reduce((s, i) => s + i.materialCost, 0))}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Timeline Produksi */}
      <Card className="mb-4 card-shadow-lg bg-white border-gray-300">
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Timeline Produksi
          </CardTitle>
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => setTimelineOpen(true)}>
            Update
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {timeline.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada timeline</p>
          )}
          {timeline.map((stage) => (
            <div key={stage.name} className="flex items-center gap-3 pb-2 border-b border-border/60 last:border-0 last:pb-0">
              <div className="flex-shrink-0">{getStageIcon(stage.status)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{stage.name}</p>
                <p className="text-xs text-muted-foreground">{stage.duration}</p>
              </div>
              <div>{getStageBadge(stage.status)}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 3. Costing — HPP & Harga Jual */}
      <Card className="card-shadow-lg bg-white border-gray-300">
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Costing & Harga Jual
          </CardTitle>
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => setCostingOpen(true)}>
            Hitung Ulang
          </Button>
        </CardHeader>
        <CardContent>
          {costing ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Material Cost</span>
                <span className="font-medium">{formatRupiah(costing.materialCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Upah Jahit</span>
                <span className="font-medium">{formatRupiah(costing.laborCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-foreground">HPP (Total)</span>
                <span className="font-bold">{formatRupiah(costing.hpp)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Markup ({costing.markupPct}%)
                </span>
                <span className="font-medium text-primary">{formatRupiah(costing.sellingPrice - costing.hpp)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ongkos Kirim</span>
                <span className="font-medium">{formatRupiah(costing.shippingCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-foreground">Harga Jual</span>
                <span className="font-bold text-lg text-primary">{formatRupiah(costing.sellingPrice)}</span>
              </div>
              <Separator className="bg-primary/20" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-600">Profit</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600 text-lg">{formatRupiah(costing.profit)}</p>
                  <p className="text-xs text-green-600">Margin {costing.profitMargin.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">Belum ada data costing</p>
              <Button size="sm" onClick={() => setCostingOpen(true)}>Hitung Harga Jual</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddBOMItemDialog open={bomOpen} onOpenChange={setBomOpen} orderId={order.id} orderNumber={order.orderNumber} />
      <UpdateTimelineDialog open={timelineOpen} onOpenChange={setTimelineOpen} orderId={order.id} orderNumber={order.orderNumber} currentStages={timeline} />
      <CostingCalculatorDialog open={costingOpen} onOpenChange={setCostingOpen} orderId={order.id} orderNumber={order.orderNumber} />
    </div>
  );
}