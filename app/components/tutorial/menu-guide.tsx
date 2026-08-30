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
import { HelpCircle, Lightbulb, Sparkles, CheckCircle2 } from "lucide-react";
import { getTutorial } from "@/lib/tutorial-data";
import { GlobalTourDialog } from "./global-tour-dialog";

/** Dialog penjelasan menu + tutorial langkah demi langkah */
export function MenuGuide({ menuKey }: { menuKey: string }) {
  const [open, setOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const tutorial = getTutorial(menuKey);
  if (!tutorial) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Panduan untuk halaman ${tutorial.title}`}
        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-primary hover:border-primary/40 active:scale-95 transition-all shadow-xs"
      >
        <HelpCircle className="h-4 w-4 text-primary shrink-0" />
        <span>Panduan</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent centered className="max-w-[480px]">
          <DialogHeader className="px-4 sm:px-5 pt-3.5 sm:pt-4 pb-2 pr-10">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg border border-primary/20">
                {tutorial.icon}
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-lg font-bold leading-tight truncate">
                  {tutorial.title}
                </DialogTitle>
                {tutorial.subtitle && (
                  <p className="text-[11px] sm:text-xs font-medium text-primary mt-0.5 truncate">
                    {tutorial.subtitle}
                  </p>
                )}
              </div>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1 leading-snug">
              {tutorial.description}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="px-4 sm:px-5 pb-4 space-y-3">
            {/* Steps */}
            <div className="space-y-1.5">
              <p className="text-[11px] sm:text-xs font-bold text-foreground">Langkah Penggunaan:</p>
              {tutorial.steps.map((step, i) => (
                <div
                  key={i}
                  className="flex gap-2.5 rounded-xl border border-gray-200 bg-white p-2.5 sm:p-3 shadow-2xs hover:border-blue-200 transition-colors"
                >
                  <div className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] sm:text-xs font-bold text-white shadow-2xs">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-foreground">
                      {step.title}
                    </p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tips Section */}
            {tutorial.tips.length > 0 && (
              <div className="rounded-xl bg-amber-50/90 border border-amber-300/80 p-3.5 text-xs text-amber-900">
                <p className="flex items-center gap-1.5 font-bold text-amber-950 mb-1.5">
                  <Lightbulb className="h-4 w-4 text-amber-700 shrink-0" />
                  Tips Penting
                </p>
                <ul className="space-y-1 pl-1">
                  {tutorial.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-amber-700 font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Banner to open full global tour */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setTourOpen(true);
                }}
                className="w-full flex items-center justify-between gap-2 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:border-blue-300 hover:shadow-xs active:scale-98 transition-all text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white text-xs">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-primary">Lihat Panduan Alur Bisnis Lengkap</p>
                    <p className="text-[11px] text-muted-foreground">5 langkah mudah dari stok hingga laporan profit</p>
                  </div>
                </div>
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              </button>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>

      <GlobalTourDialog open={tourOpen} onOpenChange={setTourOpen} />
    </>
  );
}
