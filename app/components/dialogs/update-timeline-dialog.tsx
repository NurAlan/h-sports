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
import { useToast } from "@/components/toast/toast-provider";
import { api } from "@/lib/api";

interface UpdateTimelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
  currentStages?: Array<{
    name: string;
    status: string;
  }>;
  /** Dipanggil setelah timeline berhasil diupdate — data langsung tampil tanpa reload */
  onUpdated?: (stages: Array<{ id: string; stageName: string; status: string; estimatedHrs: number | null }>) => void;
}

const stages = [
  { id: "pengukuran", name: "Pengukuran" },
  { id: "pemotongan", name: "Pemotongan" },
  { id: "jahit", name: "Jahit" },
  { id: "finishing", name: "Finishing" },
  { id: "qc", name: "QC" },
];

const statusOptions = [
  { value: "not_started", label: "Belum Dimulai", color: "bg-gray-100 text-gray-700" },
  { value: "in_progress", label: "Sedang Dikerjakan", color: "bg-blue-100 text-blue-700" },
  { value: "completed", label: "Selesai", color: "bg-green-100 text-green-700" },
];

export function UpdateTimelineDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  currentStages = [],
  onUpdated,
}: UpdateTimelineDialogProps) {
  const getInitialStatuses = () =>
    stages.reduce((acc, stage) => {
      const current = currentStages.find((s) => s.name.toLowerCase() === stage.id);
      acc[stage.id] = current?.status || "not_started";
      return acc;
    }, {} as Record<string, string>);

  const [stageStatuses, setStageStatuses] = useState<Record<string, string>>(getInitialStatuses);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Sync ulang saat dialog dibuka atau currentStages berubah
  useEffect(() => {
    if (open) {
      setStageStatuses(getInitialStatuses());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentStages]);

  const handleStatusChange = (stageId: string, status: string) => {
    setStageStatuses((prev) => ({
      ...prev,
      [stageId]: status,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await api.post<Array<{ id: string; stageName: string; status: string; estimatedHrs: number | null }>>(
        `/api/orders/${orderId}/timeline`,
        {
          stages: Object.entries(stageStatuses).map(([stageId, status]) => ({
            stageName: stageId,
            status,
          })),
        }
      );

      onOpenChange(false);
      toast.success(`Timeline ${orderNumber} berhasil diperbarui`);
      // Beri tahu parent — timeline langsung tampil tanpa reload
      onUpdated?.(created);
    } catch (err) {
      toast.error(`Gagal: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusOptions.find((opt) => opt.value === status);
    return config ? (
      <Badge variant="secondary" className={config.color}>
        {config.label}
      </Badge>
    ) : null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Timeline Produksi</DialogTitle>
          <DialogDescription>
            {orderNumber} — Ubah status setiap stage produksi
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody>
          <div className="grid gap-4">
            {stages.map((stage, index) => (
              <div key={stage.id} className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={stage.id}>
                    {index + 1}. {stage.name}
                  </Label>
                  {getStatusBadge(stageStatuses[stage.id])}
                </div>
                <Select
                  value={stageStatuses[stage.id]}
                  onValueChange={(val) => handleStatusChange(stage.id, val || "not_started")}
                  disabled={loading}
                >
                  <SelectTrigger id={stage.id}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
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
              ) : "Update Timeline"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
