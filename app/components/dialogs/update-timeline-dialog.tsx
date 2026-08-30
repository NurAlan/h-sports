"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogBody,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle2, Circle } from "lucide-react";
import { useToast } from "@/components/toast/toast-provider";
import { api, type ProductionTimeline } from "@/lib/api";

interface CurrentStageInput {
  name: string;
  status: string;
  estimatedHrs?: number | null;
  actualStart?: string | null;
  actualEnd?: string | null;
}

interface UpdateTimelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
  currentStages?: CurrentStageInput[];
  /** Dipanggil setelah timeline berhasil diupdate — data langsung tampil tanpa reload */
  onUpdated?: (stages: ProductionTimeline[]) => void;
}

const STAGES = [
  { id: "pengukuran", name: "Pengukuran", desc: "Pola & ukuran pesanan" },
  { id: "pemotongan", name: "Pemotongan", desc: "Potong kain sesuai pola" },
  { id: "jahit", name: "Jahit", desc: "Proses jahit & obras" },
  { id: "finishing", name: "Finishing", desc: "Sablon/bordir, pasang tag, packaging" },
  { id: "qc", name: "QC", desc: "Pemeriksaan kualitas & packing akhir" },
];

const STATUS_OPTIONS = [
  {
    value: "not_started",
    label: "Belum Dimulai",
    icon: Circle,
    badgeClass: "bg-gray-100 text-gray-800 border-gray-300",
  },
  {
    value: "in_progress",
    label: "Sedang Dikerjakan",
    icon: Clock,
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300 font-semibold",
  },
  {
    value: "completed",
    label: "Selesai",
    icon: CheckCircle2,
    badgeClass: "bg-green-100 text-green-800 border-green-300 font-semibold",
  },
];

interface StageFormState {
  status: string;
  actualStart: string;
  actualEnd: string;
}

function toDateInputVal(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function UpdateTimelineDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  currentStages = [],
  onUpdated,
}: UpdateTimelineDialogProps) {
  const getInitialState = (): Record<string, StageFormState> => {
    return STAGES.reduce((acc, stage) => {
      const current = currentStages.find(
        (s) => s.name.toLowerCase() === stage.id.toLowerCase()
      );
      acc[stage.id] = {
        status: current?.status || "not_started",
        actualStart: toDateInputVal(current?.actualStart),
        actualEnd: toDateInputVal(current?.actualEnd),
      };
      return acc;
    }, {} as Record<string, StageFormState>);
  };

  const [formState, setFormState] = useState<Record<string, StageFormState>>(getInitialState);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setFormState(getInitialState());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentStages]);

  const handleStatusChange = (stageId: string, newStatus: string) => {
    setFormState((prev) => {
      const current = prev[stageId] || { status: "not_started", actualStart: "", actualEnd: "" };
      let newStart = current.actualStart;
      let newEnd = current.actualEnd;

      if (newStatus === "in_progress") {
        if (!newStart) newStart = getTodayStr();
        newEnd = ""; // Belum selesai
      } else if (newStatus === "completed") {
        if (!newStart) newStart = getTodayStr();
        if (!newEnd) newEnd = getTodayStr();
      } else if (newStatus === "not_started") {
        newStart = "";
        newEnd = "";
      }

      return {
        ...prev,
        [stageId]: {
          status: newStatus,
          actualStart: newStart,
          actualEnd: newEnd,
        },
      };
    });
  };

  const handleDateChange = (
    stageId: string,
    field: "actualStart" | "actualEnd",
    value: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      [stageId]: {
        ...prev[stageId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = Object.entries(formState).map(([stageId, data]) => ({
        stageName: stageId,
        status: data.status,
        actualStart: data.actualStart ? new Date(data.actualStart).toISOString() : null,
        actualEnd: data.actualEnd ? new Date(data.actualEnd).toISOString() : null,
      }));

      const created = await api.post<ProductionTimeline[]>(
        `/api/orders/${orderId}/timeline`,
        { stages: payload }
      );

      onOpenChange(false);
      toast.success(`Timeline ${orderNumber} berhasil diperbarui`);
      onUpdated?.(created);
    } catch (err) {
      toast.error(`Gagal: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Update Timeline Produksi</DialogTitle>
          <DialogDescription>
            {orderNumber} — Catat status dan tanggal riwayat setiap tahapan
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <DialogBody>
            <div className="space-y-4">
              {STAGES.map((stage, index) => {
                const state = formState[stage.id] || {
                  status: "not_started",
                  actualStart: "",
                  actualEnd: "",
                };
                const statusConfig =
                  STATUS_OPTIONS.find((o) => o.value === state.status) || STATUS_OPTIONS[0];
                const Icon = statusConfig.icon;
                const isStarted = state.status !== "not_started";
                const isCompleted = state.status === "completed";

                return (
                  <div
                    key={stage.id}
                    className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 space-y-3 transition-colors shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <Label htmlFor={`status-${stage.id}`} className="font-semibold text-foreground text-sm block truncate">
                            {stage.name}
                          </Label>
                          <span className="text-[11px] text-muted-foreground block truncate">
                            {stage.desc}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`shrink-0 text-xs border flex items-center gap-1 ${statusConfig.badgeClass}`}
                      >
                        <Icon className="h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {/* Status selector */}
                    <div>
                      <Select
                        value={state.status}
                        onValueChange={(val) => handleStatusChange(stage.id, val || "not_started")}
                        disabled={loading}
                      >
                        <SelectTrigger id={`status-${stage.id}`} className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2">
                                <opt.icon className="h-4 w-4 text-muted-foreground" />
                                <span>{opt.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tanggal Riwayat: Mulai & Selesai (tampil saat in_progress atau completed) */}
                    {isStarted && (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200/80">
                        <div>
                          <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mb-1">
                            <Calendar className="h-3 w-3 text-blue-600" />
                            Tgl Mulai
                          </label>
                          <input
                            type="date"
                            value={state.actualStart}
                            onChange={(e) => handleDateChange(stage.id, "actualStart", e.target.value)}
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 shadow-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mb-1">
                            <Calendar className="h-3 w-3 text-green-600" />
                            Tgl Selesai
                          </label>
                          <input
                            type="date"
                            value={state.actualEnd}
                            disabled={!isCompleted}
                            onChange={(e) => handleDateChange(stage.id, "actualEnd", e.target.value)}
                            placeholder={!isCompleted ? "Menunggu selesai..." : undefined}
                            className={`h-10 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 shadow-xs ${
                              !isCompleted ? "opacity-50 cursor-not-allowed bg-gray-100" : ""
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                "Simpan Timeline"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
