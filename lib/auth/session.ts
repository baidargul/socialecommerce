import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { DemoUser, UserRole } from "@/lib/types";

const cookieName = "socialcommerce_session";
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-socialcommerce-secret-change-me");

export type SessionUser = Pick<DemoUser, "id" | "name" | "username" | "email" | "avatarUrl"> & {
  role: UserRole;
};

export async function createSessionToken(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function setSession(user: SessionUser) {
  const token = await createSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  if (!token) return null;

  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as SessionUser;
  } catch {
    return null;
  }
}
