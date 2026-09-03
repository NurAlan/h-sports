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
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300 font-medium",
  },
  {
    value: "in_progress",
    label: "Sedang Dikerjakan",
    icon: Clock,
    badgeClass: "bg-blue-50 text-blue-700 border-blue-300 font-semibold ring-1 ring-blue-500/20",
  },
  {
    value: "completed",
    label: "Selesai",
    icon: CheckCircle2,
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold ring-1 ring-emerald-500/20",
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Timeline Produksi</DialogTitle>
          <DialogDescription>
            {orderNumber} — Catat status dan tanggal riwayat setiap tahapan
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <DialogBody>
            <div className="space-y-3.5">
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
                    className={`rounded-xl border p-4 space-y-3 transition-all duration-200 shadow-xs ${
                      isCompleted
                        ? "bg-emerald-50/25 border-emerald-200"
                        : isStarted
                          ? "bg-blue-50/25 border-blue-200 ring-1 ring-blue-500/10"
                          : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                            isCompleted
                              ? "bg-emerald-600 text-white"
                              : isStarted
                                ? "bg-blue-600 text-white"
                                : "bg-slate-800 text-white"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <Label htmlFor={`status-${stage.id}`} className="font-bold text-foreground text-sm block truncate cursor-pointer">
                            {stage.name}
                          </Label>
                          <span className="text-[11px] text-muted-foreground block truncate">
                            {stage.desc}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`shrink-0 text-xs border flex items-center gap-1.5 px-2.5 py-1 ${statusConfig.badgeClass}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {/* Status selector with strong affordance */}
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-600 mb-1.5 block">
                        Pilih Status Tahapan
                      </Label>
                      <Select
                        value={state.status}
                        onValueChange={(val) => handleStatusChange(stage.id, val || "not_started")}
                        disabled={loading}
                      >
                        <SelectTrigger
                          id={`status-${stage.id}`}
                          className={`h-11 border bg-white px-3.5 shadow-xs font-semibold text-sm transition-all ${
                            isCompleted
                              ? "border-emerald-300 text-emerald-800 focus-visible:border-emerald-600 focus-visible:ring-emerald-500/20"
                              : isStarted
                                ? "border-blue-300 text-blue-800 focus-visible:border-blue-600 focus-visible:ring-blue-500/20"
                                : "border-slate-300 text-slate-800 hover:border-slate-400 focus-visible:border-blue-600 focus-visible:ring-blue-500/20"
                          }`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2 font-medium">
                                <opt.icon
                                  className={`h-4 w-4 ${
                                    opt.value === "completed"
                                      ? "text-emerald-600"
                                      : opt.value === "in_progress"
                                        ? "text-blue-600"
                                        : "text-slate-500"
                                  }`}
                                />
                                <span>{opt.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tanggal Riwayat: Mulai & Selesai */}
                    {isStarted && (
                      <div className="grid grid-cols-2 gap-2.5 pt-2.5 border-t border-slate-200/80">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 mb-1">
                            <Calendar className="h-3 w-3 text-blue-600" />
                            Tgl Mulai *
                          </label>
                          <input
                            type="date"
                            value={state.actualStart}
                            onChange={(e) => handleDateChange(stage.id, "actualStart", e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none hover:border-slate-400 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500/20 shadow-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 mb-1">
                            <Calendar className="h-3 w-3 text-emerald-600" />
                            Tgl Selesai {isCompleted && "*"}
                          </label>
                          <input
                            type="date"
                            value={state.actualEnd}
                            disabled={!isCompleted}
                            onChange={(e) => handleDateChange(stage.id, "actualEnd", e.target.value)}
                            placeholder={!isCompleted ? "Menunggu selesai..." : undefined}
                            className={`h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none hover:border-slate-400 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500/20 shadow-xs ${
                              !isCompleted ? "opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200" : ""
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
            <Button
              type="submit"
              disabled={loading}
              className="min-h-[42px] px-5 bg-blue-600 text-white font-bold hover:bg-blue-700 active:scale-95 shadow-sm transition-all"
            >
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
