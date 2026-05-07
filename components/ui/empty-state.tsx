import type { ReactNode } from "react";

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="grid min-h-48 place-items-center px-8 text-center">
      <div>
        <h2 className="text-xl font-black text-zinc-950">{title}</h2>
        {children ? <p className="mt-2 text-sm font-medium text-zinc-500">{children}</p> : null}
      </div>
    </div>
  );
}
