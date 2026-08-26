import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PageTransition } from "@/components/layout/page-transition";

export function MobileShell({
  children,
  showNav = true,
}: {
  children: ReactNode;
  showNav?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-zinc-100">
      <div className="mx-auto min-h-dvh w-full max-w-[430px] overflow-hidden bg-white text-zinc-950 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
        <PageTransition className={showNav ? "pb-24" : undefined}>
          {children}
        </PageTransition>
        {showNav ? <BottomNav /> : null}
      </div>
    </div>
  );
}
