"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FABProps {
  onClick: () => void;
  label?: string;
  className?: string;
  /** Sembunyikan FAB saat dialog terbuka — mencegah FAB menghalangi konten */
  hidden?: boolean;
}

export function FAB({ onClick, label = "Add", className, hidden = false }: FABProps) {
  if (hidden) return null;

  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-24 right-6 z-[100] h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-90",
        "bg-primary text-primary-foreground",
        className
      )}
      size="icon"
      aria-label={label}
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
