import Link from "next/link";
import { Boxes, ClipboardList, Home, LayoutDashboard, Settings, Users } from "lucide-react";
import type { SessionUser } from "@/lib/auth/session";

type DashboardShellProps = {
  user: SessionUser;
  active: "overview" | "products" | "orders" | "users" | "settings";
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function DashboardShell({ user, active, title, subtitle, children }: DashboardShellProps) {
  const isAdmin = user.role === "ADMIN";
  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard, key: "overview" },
    { label: "Products", href: "/dashboard/products", icon: Boxes, key: "products" },
    { label: "Orders", href: "/dashboard/orders", icon: ClipboardList, key: "orders" },
    ...(isAdmin ? [{ label: "Users", href: "/dashboard/users", icon: Users, key: "users" }] : []),
    { label: "Settings", href: "/dashboard/settings", icon: Settings, key: "settings" },
  ] as const;

  return (
    <main className="min-h-dvh bg-[#f7f7f7] text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white">
        <div className="flex h-14 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] text-sm font-black text-white">SC</div>
            <div>
              <h1 className="text-base font-black">Dashboard</h1>
              <p className="text-xs font-medium text-zinc-500">{user.role.toLowerCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-bold text-zinc-600 sm:inline">@{user.username}</span>
            <Link href="/profile" className="inline-flex min-h-9 items-center gap-2 rounded border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-800">
              <Home className="size-4" />
              Back to App
            </Link>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100dvh-56px)] grid-cols-[220px_1fr]">
        <aside className="border-r border-zinc-200 bg-white px-3 py-4">
          <nav className="grid gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === active;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex h-10 items-center gap-3 rounded px-3 text-left text-sm font-bold ${
                    isActive ? "bg-[#fff1f7] text-[#d62976]" : "text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="px-6 py-5">
          <div className="mb-5">
            <h2 className="text-2xl font-black">{title}</h2>
            <p className="mt-1 text-sm font-medium text-zinc-500">{subtitle}</p>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
