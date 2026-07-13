import type { NextFunction, Request, Response } from "express";
import { sessionCookieName, verifySessionToken } from "../../lib/auth/token";
import { AppError } from "../utils/http";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.[sessionCookieName];
  req.authUser = token
    ? ((await verifySessionToken(token)) ?? undefined)
    : undefined;
  next();
}
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.authUser)
    return next(new AppError(401, "UNAUTHORIZED", "Login is required."));
  next();
}
export function requireManager(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (!req.authUser)
    return next(new AppError(401, "UNAUTHORIZED", "Login is required."));
  if (!["ADMIN", "VENDOR"].includes(req.authUser.role))
    return next(
      new AppError(
        403,
        "FORBIDDEN",
        "Only admin and vendor users can manage products.",
      ),
    );
  next();
}
