"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

type DropdownOption = {
  value: string;
  label: string;
  meta?: string;
  depth?: number;
};

type SearchableDropdownProps = {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchableDropdown({ label, value, options, onChange, placeholder = "Select option" }: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => `${option.label} ${option.meta ?? ""}`.toLowerCase().includes(normalized));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative grid gap-1 text-sm font-bold text-zinc-600">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 items-center justify-between gap-3 rounded border border-zinc-200 bg-white px-3 text-left font-medium text-zinc-950 outline-none focus:border-[#d62976]"
      >
        <span className={selected ? "truncate" : "truncate text-zinc-400"}>{selected?.label ?? placeholder}</span>
        <ChevronDown className="size-4 shrink-0 text-zinc-500" />
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-[68px] z-30 overflow-hidden rounded border border-zinc-200 bg-white shadow-lg">
          <label className="flex h-10 items-center gap-2 border-b border-zinc-100 px-3">
            <Search className="size-4 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-full min-w-0 flex-1 font-medium text-zinc-950 outline-none"
              placeholder="Search..."
            />
          </label>
          <div className="max-h-64 overflow-y-auto p-1">
            {filteredOptions.length ? (
              filteredOptions.map((option) => {
                const active = option.value === value;
                return (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm ${active ? "bg-[#fff1f7] text-[#d62976]" : "text-zinc-700 hover:bg-zinc-50"}`}
                  >
                    <span style={{ paddingLeft: `${(option.depth ?? 0) * 14}px` }} className="min-w-0 flex-1">
                      <span className="block truncate font-black">{option.label}</span>
                      {option.meta ? <span className="block truncate text-xs font-medium text-zinc-500">{option.meta}</span> : null}
                    </span>
                    {active ? <Check className="size-4 shrink-0" /> : null}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-6 text-center text-sm font-bold text-zinc-500">No options found</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
