"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/use-cart-store";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/cart", label: "Cart", icon: ShoppingBag },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();
  const cartCount = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const cartBadge = cartCount > 99 ? "99+" : String(cartCount);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] border-t border-zinc-100 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 backdrop-blur">
      <div className="grid grid-cols-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "grid justify-items-center gap-1 rounded-xl py-1 text-xs font-bold transition",
                active ? "text-zinc-950" : "text-zinc-500",
              )}
            >
              <span className="relative">
                <Icon className="size-7" strokeWidth={active ? 2.5 : 2.2} />
                {item.href === "/cart" && cartCount > 0 ? (
                  <span className="absolute -right-2 -top-2 grid min-w-5 place-items-center rounded-full bg-[#d62976] px-1 text-[10px] font-black leading-5 text-white ring-2 ring-white">
                    {cartBadge}
                  </span>
                ) : null}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
