"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { ChevronDownIcon } from "lucide-react"

function SelectItem({
  value,
  children,
}: {
  value: string
  children: React.ReactNode
}) {
  return null // Data container — dirender sebagai <option> oleh Select
}

function SelectTrigger({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="select-trigger"
      className={cn("flex items-center justify-between gap-1", className)}
      {...props}
    >
      {children}
    </div>
  )
}

function SelectValue({
  className,
  children,
  placeholder,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }) {
  return (
    <span
      data-slot="select-value"
      className={cn("flex-1 text-left", className)}
      {...props}
    >
      {children}
    </span>
  )
}

function SelectContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return null // Native select menangani dropdown
}

function Select({
  value,
  onValueChange,
  children,
  className,
  placeholder,
  required,
  ...props
}: {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  placeholder?: string
  required?: boolean
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange" | "children" | "placeholder" | "required">) {
  // Ekstrak SelectItem dan placeholder dari children tree
  const extracted = React.useMemo(() => {
    const items: Array<{ value: string; label: string }> = []
    let placeholderText: string | undefined

    const walk = (node: React.ReactNode) => {
      React.Children.forEach(node, (child) => {
        if (!React.isValidElement(child)) return
        const props = child.props as Record<string, unknown>
        if (child.type === SelectItem) {
          items.push({
            value: props.value as string,
            label: props.children as string,
          })
        }
        if (child.type === SelectValue) {
          placeholderText =
            (props.placeholder as string | undefined) || placeholderText
        }
        walk((props.children as React.ReactNode) ?? null)
      })
    }
    walk(children)
    return { items, placeholderText }
  }, [children])

  const selectedItem = extracted.items.find((i) => i.value === value)
  const displayText =
    selectedItem?.label || extracted.placeholderText || placeholder || "Pilih..."

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onValueChange?.(e.target.value)
  }

  return (
    <div className="relative">
      {/* Native select transparan — menangani input & dropdown */}
      <select
        data-slot="select"
        value={value ?? ""}
        onChange={handleChange}
        required={required}
        className={cn(
          "absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0",
          className
        )}
        {...props}
      >
        <option value="" disabled>
          {displayText}
        </option>
        {extracted.items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      {/* Tampilan visual — selalu menampilkan nilai/placeholder */}
      <div
        data-slot="select-display"
        className={cn(
          "pointer-events-none flex h-8 w-full min-w-0 items-center justify-between gap-1 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm",
          className
        )}
      >
        <span
          className={cn(
            "flex-1 truncate",
            selectedItem ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {displayText}
        </span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
    </div>
  )
}

function SelectLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="select-label"
      className={cn(
        "px-2.5 py-1.5 text-xs font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function SelectSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="select-separator"
      className={cn("mx-2 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
}
