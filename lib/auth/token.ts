import { jwtVerify, SignJWT } from "jose";
import type { DemoUser, UserRole } from "@/lib/types";

export const sessionCookieName = "socialcommerce_session";

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

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as SessionUser;
  } catch {
    return null;
  }
}
