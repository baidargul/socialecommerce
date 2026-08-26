import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import {
  AccountSettingsForm,
  type AccountSettingsUser,
} from "@/components/settings/account-settings-form";
import { MobileShell } from "@/components/layout/mobile-shell";
import { getSessionUser } from "@/lib/auth/session";
import { fetchBackend } from "@/lib/backend-api";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect(`/login?next=${encodeURIComponent("/settings")}`);

  const cookieStore = await cookies();
  const response = await fetchBackend<{ user: AccountSettingsUser }>(
    "/api/v1/account/settings",
    {
      headers: { cookie: cookieStore.toString() },
    },
  );
  const user = response?.user ?? { ...sessionUser, phone: "", bio: "" };

  return (
    <MobileShell>
      <div className="px-4 py-5 sm:px-5 sm:py-6">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm font-black text-zinc-600"
        >
          <ChevronLeft className="size-4" />
          Profile
        </Link>
        <div className="mt-4">
          <h1 className="text-3xl font-black sm:text-4xl">Settings</h1>
          <p className="mt-2 text-base font-medium text-zinc-500">
            Manage your account identity and password.
          </p>
        </div>
        <div className="mt-6">
          <AccountSettingsForm user={user} variant="account" />
        </div>
      </div>
    </MobileShell>
  );
}
