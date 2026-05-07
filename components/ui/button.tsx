"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  intent?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({ className, intent = "primary", loading, icon, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
        intent === "primary" && "bg-[#5f7dde] text-white shadow-sm",
        intent === "secondary" && "bg-zinc-100 text-zinc-950",
        intent === "ghost" && "bg-transparent text-zinc-950",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {icon}
      {loading ? "Please wait..." : children}
    </button>
  );
}
