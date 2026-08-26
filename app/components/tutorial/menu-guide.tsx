"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HelpCircle, Lightbulb } from "lucide-react";
import { getTutorial, type TutorialData } from "@/lib/tutorial-data";

/** Dialog penjelasan menu + tutorial langkah demi langkah */
export function MenuGuide({ menuKey }: { menuKey: string }) {
  const [open, setOpen] = useState(false);
  const tutorial = getTutorial(menuKey);
  if (!tutorial) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Bantuan menu"
        className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-gray-50 transition-colors"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        Panduan
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span>{tutorial.icon}</span>
              {tutorial.title}
            </DialogTitle>
            <DialogDescription>{tutorial.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {tutorial.steps.map((step, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-xl border border-gray-200 bg-white p-3.5"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {tutorial.tips.length > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 mb-1.5">
                <Lightbulb className="h-3.5 w-3.5" /> Tips
              </p>
              <ul className="space-y-1">
                {tutorial.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-amber-800 flex gap-1.5">
                    <span>•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
