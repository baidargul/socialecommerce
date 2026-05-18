import Link from "next/link";
import { LayoutDashboard, Package, Settings, ShoppingBag, Heart } from "lucide-react";
import { AuthRequired } from "@/components/auth/auth-required";
import { LogoutButton } from "@/components/auth/logout-button";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Avatar } from "@/components/ui/avatar";
import { getSessionUser } from "@/lib/auth/session";
import { demoPosts } from "@/lib/demo-data";

export default async function ProfilePage() {
  const user = await getSessionUser();
  const canAccessDashboard = user?.role === "ADMIN" || user?.role === "VENDOR";

  return (
    <MobileShell>
      {user ? (
        <div className="px-5 py-6">
        <h1 className="text-4xl font-black">Profile</h1>
        <section className="mt-6 rounded-lg bg-zinc-50 p-5">
          <div className="flex items-center gap-4">
            <Avatar src={user.avatarUrl} alt={user.username} size="lg" ring="active" />
            <div>
              <h2 className="text-2xl font-black">{user.name}</h2>
              <p className="text-lg font-medium text-zinc-500">@{user.username}</p>
              <p className="mt-1 text-sm font-black text-[#1768d8]">{user.role}</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 text-center">
            <div>
              <p className="text-2xl font-black">{demoPosts.length}</p>
              <p className="text-sm font-medium text-zinc-500">Posts</p>
            </div>
            <div>
              <p className="text-2xl font-black">12.4k</p>
              <p className="text-sm font-medium text-zinc-500">Followers</p>
            </div>
            <div>
              <p className="text-2xl font-black">86</p>
              <p className="text-sm font-medium text-zinc-500">Orders</p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-3">
          {[
            { label: "Orders", icon: Package, href: null },
            { label: "Wishlist", icon: Heart, href: null },
            { label: "Saved Products", icon: ShoppingBag, href: null },
            { label: "Settings", icon: Settings, href: "/settings" },
          ].map((item) => {
            const Icon = item.icon;
            const className = "flex items-center gap-3 rounded-lg border border-zinc-100 p-4 text-lg font-black";
            const content = (
              <>
                <Icon className="size-6" />
                {item.label}
              </>
            );
            return item.href ? (
              <Link key={item.label} href={item.href} className={className}>
                {content}
              </Link>
            ) : (
              <div key={item.label} className={className}>
                {content}
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-3">
          {canAccessDashboard ? (
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-bold text-white shadow-sm transition active:scale-[0.98]"
            >
              <LayoutDashboard className="size-5" />
              Dashboard
            </Link>
          ) : null}
          <Link
            href="/settings"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#5f7dde] px-5 text-sm font-bold text-white shadow-sm transition active:scale-[0.98]"
          >
            Manage Account
          </Link>
          <LogoutButton />
        </div>
      </div>
      ) : (
        <AuthRequired title="Login to view profile" message="Your saved posts, orders, wishlist, and settings require an active session." nextPath="/profile" />
      )}
    </MobileShell>
  );
}
