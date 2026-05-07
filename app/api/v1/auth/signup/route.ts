import bcrypt from "bcryptjs";
import { apiError, apiSuccess } from "@/lib/api/response";
import { setSession } from "@/lib/auth/session";
import { canUseDatabase, prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const parsed = signupSchema.safeParse(await request.json());
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Please enter a valid name, username, email, and password.", startedAt, 422);

  const { name, username, email, password } = parsed.data;

  if (canUseDatabase()) {
    const existingUser = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (existingUser) return apiError("USER_EXISTS", "Email or username is already registered.", startedAt, 409);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: await bcrypt.hash(password, 12),
        avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80",
      },
      select: { id: true, name: true, username: true, email: true, avatarUrl: true, role: true },
    });
    await setSession({ ...user, avatarUrl: user.avatarUrl ?? "", email: user.email ?? undefined });
    return apiSuccess({ user: { ...user, avatarUrl: user.avatarUrl ?? "" } }, startedAt);
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    username,
    email,
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80",
    role: "CUSTOMER" as const,
  };
  await setSession(user);
  return apiSuccess({ user }, startedAt, { cache: "demo" });
}
