import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { createSessionToken, sessionCookieName } from "../../lib/auth/token";
import { loginSchema, signupSchema } from "../../lib/validation/schemas";
import { env } from "../config/env";
import { User } from "../models";
import { requireAuth } from "../middleware/auth";
import { AppError, success } from "../utils/http";
import { mapSessionUser } from "../utils/mappers";

export const authRouter = Router();
const limiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.cookieSecure,
    path: "/",
    maxAge: 7 * 24 * 60 * 60_000,
  };
}

authRouter.post("/signup", limiter, async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success)
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      "Please enter a valid name, username, email, and password.",
    );
  const input = {
    ...parsed.data,
    username: parsed.data.username.toLowerCase(),
    email: parsed.data.email.toLowerCase(),
  };
  if (
    await User.exists({
      $or: [{ email: input.email }, { username: input.username }],
    })
  )
    throw new AppError(
      409,
      "USER_EXISTS",
      "Email or username is already registered.",
    );
  const role = (await User.countDocuments()) === 0 ? "ADMIN" : "CUSTOMER";
  const user = await User.create({
    ...input,
    password: await bcrypt.hash(input.password, 12),
    role,
  });
  const sessionUser = mapSessionUser(user);
  res.cookie(
    sessionCookieName,
    await createSessionToken(sessionUser),
    cookieOptions(),
  );
  return success(req, res, { user: sessionUser });
});
authRouter.post("/login", limiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success)
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      "Please enter a valid email and password.",
    );
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() });
  if (
    !user?.password ||
    !(await bcrypt.compare(parsed.data.password, user.password))
  )
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid email or password.",
    );
  const sessionUser = mapSessionUser(user);
  res.cookie(
    sessionCookieName,
    await createSessionToken(sessionUser),
    cookieOptions(),
  );
  return success(req, res, { user: sessionUser });
});
authRouter.post("/logout", (req, res) => {
  res.clearCookie(sessionCookieName, { path: "/" });
  return success(req, res, { loggedOut: true });
});
authRouter.get("/me", requireAuth, (req, res) =>
  success(req, res, { user: req.authUser }),
);
