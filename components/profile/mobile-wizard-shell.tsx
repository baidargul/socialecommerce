"use client";

import { useCallback, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, X } from "lucide-react";

export function MobileWizardShell({
  title,
  steps,
  currentStep,
  dirty,
  busy = false,
  onBack,
  onClose,
  footer,
  children,
}: {
  title: string;
  steps: string[];
  currentStep: number;
  dirty: boolean;
  busy?: boolean;
  onBack?: () => void;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
}) {
  const portalRoot = typeof document === "undefined" ? null : document.body;

  const requestClose = useCallback(() => {
    if (busy) return;
    if (dirty && !window.confirm("Discard your changes?")) return;
    onClose();
  }, [busy, dirty, onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [requestClose]);

  if (!portalRoot) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-white text-zinc-950 shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <header className="shrink-0 border-b border-zinc-100 bg-white px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack ?? requestClose}
            disabled={busy}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-700 disabled:opacity-50"
            aria-label={onBack ? "Previous step" : "Close wizard"}
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="min-w-0 text-center">
            <h2 className="truncate text-lg font-black">{title}</h2>
            <p className="text-xs font-bold text-zinc-500">
              Step {currentStep + 1} of {steps.length} · {steps[currentStep]}
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={busy}
            className="grid size-10 shrink-0 place-items-center rounded-full text-zinc-600 disabled:opacity-50"
            aria-label="Close wizard"
          >
            <X className="size-5" />
          </button>
        </div>
        <div
          className="mt-3 grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
          }}
        >
          {steps.map((step, index) => (
            <div
              key={step}
              className={`h-1 rounded-full ${index <= currentStep ? "bg-[#d62976]" : "bg-zinc-200"}`}
            />
          ))}
        </div>
      </header>

      <main className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-4 py-5">
        {children}
      </main>

      <footer className="shrink-0 border-t border-zinc-100 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3">
        {footer}
      </footer>
    </div>,
    portalRoot,
  );
}
