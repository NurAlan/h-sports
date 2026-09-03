"use client";

import { cn } from "@/lib/utils";

interface CurrencyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type"
  > {
  /** Nilai angka murni (tanpa format), misal "500000" */
  value: string;
  /** Dipanggil dengan angka murni, misal "500000" */
  onChange: (value: string) => void;
}

/**
 * Input nominal uang dengan format Indonesia (titik ribuan).
 * User mengetik "500000" → tampil "500.000".
 * Value yang disimpan tetap angka murni "500000" (siap submit ke API).
 */
export function CurrencyInput({
  value,
  onChange,
  className,
  ...props
}: CurrencyInputProps) {
  const display = value ? Number(value).toLocaleString("id-ID") : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Ambil digit saja, lalu simpan sebagai angka murni
    const raw = e.target.value.replace(/[^\d]/g, "");
    onChange(raw);
  };

  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={display}
      onChange={handleChange}
      className={cn(
        "h-11 md:h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
        className
      )}
    />
  );
}
