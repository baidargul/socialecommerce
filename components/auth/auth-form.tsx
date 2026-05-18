"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/input";
import type { SessionUser } from "@/lib/auth/session";
import { useAuthStore } from "@/store/use-auth-store";

type AuthFormProps = {
  mode: "login" | "signup";
  nextPath: string;
};

function getSafeNextPath(nextPath: string) {
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) return "/";
  return nextPath;
}

type AuthResponse = {
  success: boolean;
  data?: {
    user?: SessionUser;
  };
  error?: {
    message?: string;
  } | null;
};

async function readAuthResponse(response: Response): Promise<AuthResponse> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as AuthResponse;
  }

  return {
    success: false,
    error: {
      message: response.ok
        ? "The authentication service returned an invalid response."
        : "The authentication service is unavailable. Make sure the backend server is running.",
    },
  };
}

export function AuthForm({ mode, nextPath }: AuthFormProps) {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setLoading(true);
    setError("");

    try {
      const payload = Object.fromEntries(formData);
      const response = await fetch(`/api/v1/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await readAuthResponse(response);

      if (!response.ok || !body.success || !body.data?.user) {
        setError(body.error?.message ?? "Something went wrong.");
        return;
      }

      setUser(body.data.user);
      router.push(getSafeNextPath(nextPath));
    } catch {
      setError("The authentication service is unavailable. Make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={submit} className="grid gap-4">
      {mode === "signup" ? (
        <>
          <TextInput name="name" label="Name" placeholder="Demo Customer" required />
          <TextInput name="username" label="Username" placeholder="demo_customer" required />
        </>
      ) : null}
      <TextInput name="email" label="Email" type="email" placeholder="demo@example.com" required />
      <TextInput name="password" label="Password" type="password" placeholder="password123" required />
      {error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}
      <Button loading={loading} className="mt-2 w-full text-lg">
        {mode === "login" ? "Login" : "Create Account"}
      </Button>
    </form>
  );
}
