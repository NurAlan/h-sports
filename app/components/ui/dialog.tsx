"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { cn } from "@/lib/utils"
import { XIcon } from "lucide-react"

function Dialog({
  ...props
}: DialogPrimitive.DialogProps) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: DialogPrimitive.DialogTriggerProps) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: DialogPrimitive.DialogPortalProps) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: DialogPrimitive.DialogCloseProps) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.DialogOverlayProps) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

export interface DialogContentProps extends DialogPrimitive.DialogContentProps {
  centered?: boolean;
}

function DialogContent({
  className,
  children,
  centered = false,
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed z-50 flex flex-col bg-white overflow-hidden transition-all duration-200",
          centered
            ? [
                // Mobile & Desktop: Centered modal with safe viewport margins
                "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                "w-[calc(100vw-1.5rem)] max-w-[500px] max-h-[85dvh] rounded-xl border border-stone-200",
                "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
                "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
              ]
            : [
                // Mobile: Bottom sheet
                "max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:w-full max-sm:max-h-[88dvh] max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:border-t max-sm:border-x-0 max-sm:border-b-0",
                // Desktop: Centered modal
                "sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[calc(100vw-2rem)] sm:max-w-[480px] sm:max-h-[85vh] sm:rounded-xl sm:border border-stone-200",
                // Animasi masuk
                "data-[state=open]:animate-in data-[state=open]:fade-in-0 max-sm:data-[state=open]:slide-in-from-bottom-8 sm:data-[state=open]:zoom-in-95 sm:data-[state=open]:slide-in-from-bottom-2",
                "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 max-sm:data-[state=closed]:slide-out-to-bottom-8 sm:data-[state=closed]:zoom-out-95",
              ],
          "shadow-[0_32px_64px_-12px_oklch(0.4_0.02_260/0.20),0_12px_32px_-8px_oklch(0.4_0.02_260/0.12)]",
          className
        )}
        {...props}
      >
        {/* Visual drag handle indicator for mobile only if bottom sheet */}
        {!centered && (
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-gray-300 sm:hidden" />
        )}
        {children}
        {/* Tombol close */}
        <DialogPrimitive.Close className="absolute right-3.5 top-3.5 z-10 flex h-8 w-8 items-center justify-center rounded bg-stone-100 text-stone-600 transition-all duration-150 hover:bg-stone-200 hover:text-foreground active:scale-90 focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none">
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col gap-1 px-5 pt-4 pb-3 pr-12 shrink-0",
        className
      )}
      {...props}
    />
  )
}

/** Wrapper untuk body/konten form — padding konsisten */
function DialogBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-body"
      className={cn(
        "flex-1 overflow-y-auto px-5 pb-5 overscroll-contain",
        className
      )}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "sticky bottom-0 z-10 flex flex-row items-center justify-end gap-2.5 shrink-0",
        "border-t border-gray-100 bg-white/95 backdrop-blur-sm px-5 pt-4 pb-5 max-sm:pb-6",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: DialogPrimitive.DialogTitleProps) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "text-lg font-semibold leading-tight tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.DialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground leading-relaxed mt-0.5", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
