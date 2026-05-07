import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { MobileShell } from "@/components/layout/mobile-shell";
import { normalizeNextPath } from "@/lib/auth/next-path";

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const nextPath = normalizeNextPath((await searchParams).next);
  const signupHref = `/signup?next=${encodeURIComponent(nextPath)}`;

  return (
    <MobileShell showNav={false}>
      <div className="grid min-h-dvh content-center px-5 py-8">
        <h1 className="text-4xl font-black">Login</h1>
        <p className="mt-2 text-lg font-medium text-zinc-500">Use demo@example.com and password123 after seeding, or create a new account.</p>
        <div className="mt-8">
          <AuthForm mode="login" nextPath={nextPath} />
        </div>
        <Link href={signupHref} className="mt-6 text-center text-sm font-black text-[#1768d8]">
          Create an account
        </Link>
      </div>
    </MobileShell>
  );
}
