"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogBody,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HelpCircle, Lightbulb } from "lucide-react";
import { getTutorial } from "@/lib/tutorial-data";

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

          <DialogBody className="flex flex-col gap-3">
            <div className="space-y-2">
              {tutorial.steps.map((step, i) => (
                <div
                  key={i}
                  className="flex gap-2.5 rounded-xl border border-gray-200 bg-white p-3"
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {step.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {tutorial.tips.length > 0 && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 mb-1">
                  <Lightbulb className="h-3 w-3" /> Tips
                </p>
                <ul className="space-y-0.5">
                  {tutorial.tips.map((tip, i) => (
                    <li key={i} className="text-[11px] text-amber-800 flex gap-1.5">
                      <span>•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
