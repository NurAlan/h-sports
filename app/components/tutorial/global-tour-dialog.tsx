"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { ONBOARDING_JOURNEY } from "@/lib/tutorial-data";
import { setHasSeenTour } from "@/lib/tutorial-storage";

interface GlobalTourDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalTourDialog({ open, onOpenChange }: GlobalTourDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const slides = ONBOARDING_JOURNEY;
  const slide = slides[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === slides.length - 1;

  const handleClose = () => {
    setHasSeenTour(true);
    onOpenChange(false);
  };

  const handleNext = () => {
    if (isLast) {
      handleClose();
      setCurrentStep(0);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) setHasSeenTour(true);
        onOpenChange(val);
      }}
    >
      <DialogContent centered className="max-w-[480px]">
        {/* Header */}
        <DialogHeader className="px-4 sm:px-5 pt-3.5 sm:pt-4 pb-2 pr-10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs sm:text-sm font-bold">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <DialogTitle className="text-base sm:text-lg font-bold truncate">
                Panduan Alur Bisnis
              </DialogTitle>
            </div>
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-900 border-blue-300 font-semibold text-[11px] px-2 py-0.5 shrink-0"
            >
              {currentStep + 1} / {slides.length}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-snug">
            Alur operasional dari stok, order, produksi hingga laporan profit.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="px-4 sm:px-5 pb-3">
          {/* Step Progress Indicators */}
          <div className="flex items-center gap-1.5 mb-3">
            {slides.map((s, idx) => (
              <button
                key={s.stepNumber}
                type="button"
                onClick={() => setCurrentStep(idx)}
                aria-label={`Lompat ke langkah ${s.stepNumber}`}
                className={`h-1.5 sm:h-2 flex-1 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? "bg-primary"
                    : idx < currentStep
                    ? "bg-primary/40"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Slide Card Content */}
          <div className="rounded-xl sm:rounded-2xl border-2 border-blue-100 bg-blue-50/40 p-3 sm:p-4 space-y-2.5 sm:space-y-3 shadow-2xs">
            {/* Header Slide */}
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white border border-blue-200 text-xl sm:text-2xl shadow-2xs">
                {slide.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Badge variant="outline" className="text-[10px] font-bold text-primary bg-white border-primary/30 py-0 px-1.5">
                    {slide.badge}
                  </Badge>
                  <span className="text-[11px] font-semibold text-foreground/80 truncate">
                    {slide.title}
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                  {slide.headline}
                </h3>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-foreground/90 leading-relaxed bg-white/90 rounded-lg sm:rounded-xl p-2.5 border border-blue-100/80">
              {slide.description}
            </p>

            {/* Key action points */}
            <div className="space-y-1.5">
              <p className="text-[11px] sm:text-xs font-bold text-foreground">Poin Kunci:</p>
              <div className="space-y-1">
                {slide.keyPoints.map((point, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] sm:text-xs text-foreground/80">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600 mt-0.5" />
                    <span className="leading-tight">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Link to Feature */}
            {slide.actionLink && (
              <div className="pt-2 border-t border-blue-100 flex items-center justify-end">
                <Link
                  href={slide.actionLink}
                  onClick={() => onOpenChange(false)}
                  className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-primary hover:underline bg-white px-2.5 py-1 rounded-lg border border-primary/20 shadow-2xs active:scale-95 transition-all"
                >
                  {slide.actionText || "Buka Halaman"}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter className="flex-row items-center justify-between gap-2 border-t border-gray-100 bg-white px-4 sm:px-5 py-2.5 sm:py-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrev}
            disabled={isFirst}
            className="min-h-[40px] sm:min-h-[44px] px-3 sm:px-4 gap-1 text-xs sm:text-sm font-semibold disabled:opacity-30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Sebelumnya
          </Button>

          <Button
            type="button"
            onClick={handleNext}
            className="min-h-[40px] sm:min-h-[44px] px-4 sm:px-5 gap-1.5 text-xs sm:text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs active:scale-98 transition-all"
          >
            {isLast ? (
              <>
                Selesai
                <CheckCircle2 className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Lanjut
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
