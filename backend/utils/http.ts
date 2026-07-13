import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { logger } from "./logger";

export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function requestContext(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.requestStartedAt = Date.now();
  req.requestId = String(req.headers["x-request-id"] ?? crypto.randomUUID());
  res.setHeader("x-request-id", req.requestId);
  next();
}
export function success<T>(
  req: Request,
  res: Response,
  data: T,
  status = 200,
  extra?: Record<string, unknown>,
) {
  return res
    .status(status)
    .json({
      success: true,
      data,
      error: null,
      meta: {
        requestId: req.requestId,
        timingMs: Date.now() - (req.requestStartedAt ?? Date.now()),
        ...extra,
      },
    });
}
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  void _next;
  if (error instanceof AppError)
    return res
      .status(error.status)
      .json({
        success: false,
        data: null,
        error: { code: error.code, message: error.message },
        meta: {
          requestId: req.requestId,
          timingMs: Date.now() - (req.requestStartedAt ?? Date.now()),
        },
      });
  const mongoError = error as {
    code?: number;
    keyPattern?: Record<string, number>;
  };
  if (mongoError?.code === 11000)
    return res
      .status(409)
      .json({
        success: false,
        data: null,
        error: {
          code: "CONFLICT",
          message: "A record with these details already exists.",
        },
        meta: { requestId: req.requestId },
      });
  logger.error(
    { err: error, requestId: req.requestId },
    "Unhandled request error",
  );
  return res
    .status(500)
    .json({
      success: false,
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Something went wrong." },
      meta: { requestId: req.requestId },
    });
}
export function notFound(req: Request, res: Response) {
  return res
    .status(404)
    .json({
      success: false,
      data: null,
      error: {
        code: "NOT_FOUND",
        message: `Route ${req.method} ${req.path} not found.`,
      },
      meta: { requestId: req.requestId },
    });
}
export function stringId(value: unknown) {
  return String(value ?? "");
}
export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
