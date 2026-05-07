import { Package, Settings, ShoppingBag, Heart } from "lucide-react";
import { AuthRequired } from "@/components/auth/auth-required";
import { LogoutButton } from "@/components/auth/logout-button";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";
import { demoPosts } from "@/lib/demo-data";

export default async function ProfilePage() {
  const user = await getSessionUser();

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
            { label: "Orders", icon: Package },
            { label: "Wishlist", icon: Heart },
            { label: "Saved Products", icon: ShoppingBag },
            { label: "Settings", icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 rounded-lg border border-zinc-100 p-4 text-lg font-black">
                <Icon className="size-6" />
                {item.label}
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-3">
          <Button className="w-full">Manage Account</Button>
          <LogoutButton />
        </div>
      </div>
      ) : (
        <AuthRequired title="Login to view profile" message="Your saved posts, orders, wishlist, and settings require an active session." nextPath="/profile" />
      )}
    </MobileShell>
  );
}
