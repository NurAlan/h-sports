"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FABProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function FAB({ onClick, label = "Add", className }: FABProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-20 right-6 z-40 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all",
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
