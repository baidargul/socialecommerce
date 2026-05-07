"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export function TextInput({ label, error, helperText, className, id, ...props }: TextInputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="grid gap-2 text-sm font-semibold text-zinc-900" htmlFor={inputId}>
      {label}
      <input
        id={inputId}
        className={cn(
          "h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-base font-medium outline-none transition placeholder:text-zinc-400 focus:border-zinc-900",
          error && "border-red-500",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
      {!error && helperText ? <span className="text-xs font-medium text-zinc-500">{helperText}</span> : null}
    </label>
  );
}
