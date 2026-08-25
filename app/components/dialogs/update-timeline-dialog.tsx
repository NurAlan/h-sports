"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

interface UpdateTimelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
  currentStages?: Array<{
    name: string;
    status: string;
  }>;
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
}: UpdateTimelineDialogProps) {
  // Initialize stage statuses from currentStages or default to not_started
  const [stageStatuses, setStageStatuses] = useState<Record<string, string>>(
    stages.reduce((acc, stage) => {
      const current = currentStages.find((s) => s.name.toLowerCase() === stage.id);
      acc[stage.id] = current?.status || "not_started";
      return acc;
    }, {} as Record<string, string>)
  );

  const handleStatusChange = (stageId: string, status: string) => {
    setStageStatuses((prev) => ({
      ...prev,
      [stageId]: status,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: API call to update production timeline
    console.log({
      orderId,
      stages: Object.entries(stageStatuses).map(([stageId, status]) => ({
        stage_name: stageId,
        status,
        // If status changes to in_progress → set actual_start
        // If status changes to completed → set actual_end
      })),
    });

    onOpenChange(false);
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
          <div className="grid gap-4 py-4">
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
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit">
              Update Timeline
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
