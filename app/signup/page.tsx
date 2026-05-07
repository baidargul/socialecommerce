import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { MobileShell } from "@/components/layout/mobile-shell";
import { normalizeNextPath } from "@/lib/auth/next-path";

type SignupPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const nextPath = normalizeNextPath((await searchParams).next);
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;

  return (
    <MobileShell showNav={false}>
      <div className="grid min-h-dvh content-center px-5 py-8">
        <h1 className="text-4xl font-black">Create Account</h1>
        <p className="mt-2 text-lg font-medium text-zinc-500">Join the feed and start shopping from creator posts.</p>
        <div className="mt-8">
          <AuthForm mode="signup" nextPath={nextPath} />
        </div>
        <Link href={loginHref} className="mt-6 text-center text-sm font-black text-[#1768d8]">
          Already have an account?
        </Link>
      </div>
    </MobileShell>
  );
}
