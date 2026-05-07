import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

type AuthRequiredProps = {
  title: string;
  message: string;
  nextPath: string;
};

export function AuthRequired({ title, message, nextPath }: AuthRequiredProps) {
  const encodedNext = encodeURIComponent(nextPath);

  return (
    <div className="grid min-h-[calc(100dvh-96px)] content-center px-5 py-8 text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-zinc-100">
        <LockKeyhole className="size-7 text-zinc-950" />
      </div>
      <h1 className="mt-5 text-3xl font-black">{title}</h1>
      <p className="mx-auto mt-2 max-w-xs text-base font-medium text-zinc-500">{message}</p>
      <div className="mt-7 grid gap-3">
        <Link href={`/login?next=${encodedNext}`}>
          <Button className="w-full">Login</Button>
        </Link>
        <Link href={`/signup?next=${encodedNext}`}>
          <Button intent="secondary" className="w-full">Create Account</Button>
        </Link>
      </div>
    </div>
  );
}
