import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AccountSettingsForm, type AccountSettingsUser } from "@/components/settings/account-settings-form";
import { getSessionUser } from "@/lib/auth/session";
import { fetchBackend } from "@/lib/backend-api";

export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect(`/login?next=${encodeURIComponent("/dashboard/settings")}`);
  if (sessionUser.role !== "ADMIN" && sessionUser.role !== "VENDOR") redirect("/profile");

  const cookieStore = await cookies();
  const response = await fetchBackend<{ user: AccountSettingsUser }>("/api/v1/account/settings", {
    headers: { cookie: cookieStore.toString() },
  });
  const user = response?.user ?? { ...sessionUser, phone: "", bio: "" };

  return (
    <DashboardShell user={sessionUser} active="settings" title="Settings" subtitle="Manage your public seller identity and account security.">
      <AccountSettingsForm user={user} variant="vendor" />
    </DashboardShell>
  );
}
