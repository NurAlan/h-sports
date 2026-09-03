"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Label } from "@/components/ui/label";

interface SearchableSelectProps<T> {
  items: T[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  /** Function to get display text from item */
  getItemLabel: (item: T) => string;
  /** Function to get value from item */
  getItemValue: (item: T) => string;
  /** Optional: render custom item content */
  renderItem?: (item: T) => React.ReactNode;
  /** Optional: filter function (default: case-insensitive label match) */
  filterItems?: (item: T, query: string) => boolean;
}

export function SearchableSelect<T>({
  items,
  value,
  onValueChange,
  placeholder = "Cari...",
  label,
  required,
  disabled,
  getItemLabel,
  getItemValue,
  renderItem,
  filterItems,
}: SearchableSelectProps<T>) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Filter items berdasarkan search query
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const query = search.toLowerCase();
    return items.filter((item) =>
      filterItems
        ? filterItems(item, query)
        : getItemLabel(item).toLowerCase().includes(query)
    );
  }, [items, search, filterItems, getItemLabel]);

  // Get selected item label untuk display
  const selectedLabel = useMemo(() => {
    const selected = items.find((item) => getItemValue(item) === value);
    return selected ? getItemLabel(selected) : "";
  }, [items, value, getItemLabel, getItemValue]);

  const handleSelect = (itemValue: string) => {
    onValueChange(itemValue);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="grid gap-2">
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </Label>
      )}
      <div className="relative">
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full h-10 px-3 py-2 text-left bg-white border border-border rounded-md text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
        >
          <span className={selectedLabel ? "text-foreground" : "text-muted-foreground"}>
            {selectedLabel || placeholder}
          </span>
          <svg
            className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Dropdown content */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            {/* Dropdown panel */}
            <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-md shadow-lg max-h-80 overflow-hidden flex flex-col">
              {/* Search input */}
              <div className="p-2 border-b border-border flex items-center gap-2 bg-stone-50">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent text-base focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Items list */}
              <div className="overflow-y-auto flex-1">
                {filteredItems.length === 0 ? (
                  <div className="px-3 py-4 text-center text-base text-muted-foreground">
                    Tidak ditemukan
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const itemValue = getItemValue(item);
                    const isSelected = itemValue === value;
                    return (
                      <button
                        key={itemValue}
                        type="button"
                        onClick={() => handleSelect(itemValue)}
                        className={`w-full px-3 py-2 text-left text-base hover:bg-stone-100 transition-colors ${
                          isSelected ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                        }`}
                      >
                        {renderItem ? renderItem(item) : getItemLabel(item)}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
