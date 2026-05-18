"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, Eye, KeyRound, RefreshCcw, Save, ShieldCheck, Sparkles } from "lucide-react";
import type { SessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/input";

export type AccountSettingsUser = SessionUser & {
  phone?: string;
  bio?: string;
};

type AccountSettingsFormProps = {
  user: AccountSettingsUser;
  variant: "account" | "vendor";
};

type SettingsPayload = {
  name: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
  avatarUrl: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
};

function toPayload(user: AccountSettingsUser): SettingsPayload {
  return {
    name: user.name,
    username: user.username,
    email: user.email ?? "",
    phone: user.phone ?? "",
    bio: user.bio ?? "",
    avatarUrl: user.avatarUrl ?? "",
  };
}

function isImageUrl(value: string) {
  if (value.startsWith("/")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function readEnvelope<T>(response: Response, fallbackMessage = "The server returned an invalid response."): Promise<ApiEnvelope<T>> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return (await response.json()) as ApiEnvelope<T>;
  const text = await response.text().catch(() => "");
  const message = text.includes("Cannot POST")
    ? "The upload route is not available yet. Restart npm run dev:all so the backend loads the profile upload endpoint."
    : response.status >= 500
      ? "The upload service is unavailable. Restart the backend and try again."
      : fallbackMessage;

  return {
    success: false,
    data: null,
    error: { code: "INVALID_RESPONSE", message },
  };
}

export function AccountSettingsForm({ user, variant }: AccountSettingsFormProps) {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const initialPayload = useMemo(() => toPayload(user), [user]);
  const [savedForm, setSavedForm] = useState<SettingsPayload>(initialPayload);
  const [form, setForm] = useState<SettingsPayload>(initialPayload);
  const [profileStatus, setProfileStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [profileMessage, setProfileMessage] = useState("");
  const [avatarStatus, setAvatarStatus] = useState<"idle" | "uploading" | "uploaded" | "error">("idle");
  const [avatarMessage, setAvatarMessage] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);
  const previewImageUrl = isImageUrl(form.avatarUrl) ? form.avatarUrl : "";
  const completionItems = [Boolean(form.name && form.username), Boolean(form.email || form.phone), Boolean(form.avatarUrl), Boolean(form.bio)];
  const completion = Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100);
  const title = variant === "vendor" ? "Vendor Profile" : "Account Details";
  const subtitle = variant === "vendor" ? "Keep your public seller identity accurate across the shop." : "Keep your social commerce identity current.";

  function updateField(field: keyof SettingsPayload, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setProfileStatus("idle");
    setProfileMessage("");
  }

  async function saveProfile() {
    setProfileStatus("saving");
    setProfileMessage("");

    try {
      const response = await fetch("/api/v1/account/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await readEnvelope<{ user: AccountSettingsUser }>(response);
      if (!response.ok || !body.success || !body.data?.user) {
        setProfileStatus("error");
        setProfileMessage(body.error?.message ?? "Could not save settings.");
        return;
      }

      setUser(body.data.user);
      const updatedForm = toPayload(body.data.user);
      setSavedForm(updatedForm);
      setForm(updatedForm);
      setProfileStatus("saved");
      setProfileMessage("Settings saved.");
      router.refresh();
    } catch {
      setProfileStatus("error");
      setProfileMessage("Could not reach the settings service.");
    }
  }

  async function uploadAvatar(file: File | undefined) {
    if (!file) return;
    setAvatarStatus("uploading");
    setAvatarMessage("");

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await fetch("/api/v1/account/avatar", {
        method: "POST",
        body: formData,
      });
      const body = await readEnvelope<{ user: AccountSettingsUser }>(response, "Profile image upload did not return a valid response.");
      if (!response.ok || !body.success || !body.data?.user) {
        setAvatarStatus("error");
        setAvatarMessage(body.error?.message ?? "Could not upload profile image.");
        return;
      }

      setUser(body.data.user);
      const updatedForm = toPayload(body.data.user);
      setSavedForm(updatedForm);
      setForm(updatedForm);
      setAvatarStatus("uploaded");
      setAvatarMessage("Profile image uploaded.");
      router.refresh();
    } catch {
      setAvatarStatus("error");
      setAvatarMessage("Could not reach the upload service.");
    }
  }

  async function changePassword() {
    setPasswordStatus("saving");
    setPasswordMessage("");

    try {
      const response = await fetch("/api/v1/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwords),
      });
      const body = await readEnvelope<{ ok: boolean }>(response);
      if (!response.ok || !body.success) {
        setPasswordStatus("error");
        setPasswordMessage(body.error?.message ?? "Could not update password.");
        return;
      }

      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordStatus("saved");
      setPasswordMessage("Password updated.");
    } catch {
      setPasswordStatus("error");
      setPasswordMessage("Could not reach the password service.");
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <section className="grid gap-5">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-[#d62976]" />
                <h2 className="text-xl font-black">{title}</h2>
              </div>
              <p className="mt-1 text-sm font-medium text-zinc-500">{subtitle}</p>
            </div>
            <span className={cn("rounded px-2 py-1 text-xs font-black", isDirty ? "bg-yellow-50 text-yellow-700" : "bg-emerald-50 text-emerald-700")}>
              {isDirty ? "Unsaved changes" : "Up to date"}
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <TextInput label="Name" value={form.name} onChange={(event) => updateField("name", event.target.value)} />
            <TextInput label="Username" value={form.username} onChange={(event) => updateField("username", event.target.value)} />
            <TextInput label="Email" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
            <TextInput label="Phone" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
            <label className="grid gap-2 text-sm font-semibold text-zinc-900 md:col-span-2">
              Bio
              <textarea
                className="min-h-28 resize-y rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base font-medium outline-none transition placeholder:text-zinc-400 focus:border-zinc-900"
                maxLength={240}
                value={form.bio}
                onChange={(event) => updateField("bio", event.target.value)}
              />
              <span className="text-xs font-medium text-zinc-500">{form.bio.length}/240 characters</span>
            </label>
          </div>

          {profileMessage ? (
            <p className={cn("mt-4 rounded-lg p-3 text-sm font-bold", profileStatus === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700")}>{profileMessage}</p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <Button icon={<Save className="size-4" />} loading={profileStatus === "saving"} disabled={!isDirty || profileStatus === "saving"} onClick={saveProfile}>
              Save Changes
            </Button>
            <Button intent="secondary" icon={<RefreshCcw className="size-4" />} disabled={!isDirty || profileStatus === "saving"} onClick={() => setForm(savedForm)}>
              Reset
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <KeyRound className="size-5 text-zinc-500" />
            <h2 className="text-xl font-black">Password</h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <TextInput
              label="Current password"
              type="password"
              value={passwords.currentPassword}
              onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))}
            />
            <TextInput
              label="New password"
              type="password"
              value={passwords.newPassword}
              onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))}
            />
            <TextInput
              label="Confirm password"
              type="password"
              value={passwords.confirmPassword}
              onChange={(event) => setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))}
            />
          </div>
          {passwordMessage ? (
            <p className={cn("mt-4 rounded-lg p-3 text-sm font-bold", passwordStatus === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700")}>{passwordMessage}</p>
          ) : null}
          <Button className="mt-5" icon={<ShieldCheck className="size-4" />} loading={passwordStatus === "saving"} onClick={changePassword}>
            Update Password
          </Button>
        </div>
      </section>

      <aside className="grid content-start gap-5">
        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Eye className="size-5 text-zinc-500" />
            <h2 className="text-xl font-black">Live Preview</h2>
          </div>
          <div className="mt-5 rounded-lg border border-zinc-100 bg-zinc-50 p-4">
            <div className="flex items-center gap-3">
              <label className="group relative grid size-20 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full bg-zinc-200 text-base font-black text-zinc-500 ring-4 ring-white transition hover:ring-[#fff1f7]">
                {previewImageUrl ? <Image src={previewImageUrl} alt={form.username} fill sizes="80px" className="object-cover" unoptimized /> : form.username.slice(0, 2).toUpperCase()}
                <span className="absolute inset-0 grid place-items-center bg-black/0 text-white transition group-hover:bg-black/45">
                  <span className="grid size-9 place-items-center rounded-full bg-black/65 opacity-0 transition group-hover:opacity-100">
                    <Camera className="size-5" />
                  </span>
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={avatarStatus === "uploading"}
                  onChange={(event) => {
                    void uploadAvatar(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>
              <div className="min-w-0">
                <p className="truncate text-lg font-black">{form.name || "Your name"}</p>
                <p className="truncate text-sm font-bold text-zinc-500">@{form.username || "username"}</p>
                <p className="mt-1 inline-flex rounded bg-[#fff1f7] px-2 py-1 text-xs font-black text-[#d62976]">{user.role}</p>
              </div>
            </div>
            <p className="mt-4 text-sm font-medium leading-6 text-zinc-600">{form.bio || "Add a short bio so customers and creators know what makes this profile distinct."}</p>
            <p className="mt-3 text-xs font-bold text-zinc-500">
              {avatarStatus === "uploading" ? "Uploading profile image..." : "Click the display picture to upload JPG, PNG, or WebP up to 5 MB."}
            </p>
            {avatarMessage ? (
              <p className={cn("mt-3 rounded-lg p-3 text-sm font-bold", avatarStatus === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700")}>{avatarMessage}</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Completion</h2>
            <span className="text-2xl font-black text-[#1768d8]">{completion}%</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full rounded-full bg-[#1768d8]" style={{ width: `${completion}%` }} />
          </div>
          <div className="mt-4 grid gap-2 text-sm font-bold text-zinc-600">
            {[
              ["Profile identity", Boolean(form.name && form.username)],
              ["Reachable contact", Boolean(form.email || form.phone)],
              ["Visual avatar", Boolean(form.avatarUrl)],
              ["Bio context", Boolean(form.bio)],
            ].map(([label, done]) => (
              <div key={String(label)} className="flex items-center gap-2">
                <CheckCircle2 className={cn("size-4", done ? "text-emerald-600" : "text-zinc-300")} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
