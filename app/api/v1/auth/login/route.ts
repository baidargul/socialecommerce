import bcrypt from "bcryptjs";
import { apiError, apiSuccess } from "@/lib/api/response";
import { setSession } from "@/lib/auth/session";
import { canUseDatabase, prisma } from "@/lib/prisma";
import { demoUsers } from "@/lib/demo-data";
import { loginSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Please enter a valid email and password.", startedAt, 422);

  const { email, password } = parsed.data;

  if (canUseDatabase()) {
    const user = await prisma.user.findUnique({ where: { email } });
    const validPassword = user?.password ? await bcrypt.compare(password, user.password) : false;
    if (!user || !validPassword) return apiError("INVALID_CREDENTIALS", "Invalid email or password.", startedAt, 401);

    const sessionUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email ?? undefined,
      avatarUrl: user.avatarUrl ?? "",
      role: user.role,
    };
    await setSession(sessionUser);
    return apiSuccess({ user: sessionUser }, startedAt);
  }

  if (email !== "demo@example.com" || password !== "password123") {
    return apiError("INVALID_CREDENTIALS", "Use demo@example.com with password123, or create an account.", startedAt, 401);
  }

  const demoUser = demoUsers[5];
  await setSession(demoUser);
  return apiSuccess({ user: demoUser }, startedAt, { cache: "demo" });
}
