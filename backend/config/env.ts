import "dotenv/config";
import path from "node:path";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  MONGODB_URI: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  BACKEND_PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  PUBLIC_API_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32).optional(),
  UPLOAD_DIR: z.string().optional(),
  LOG_LEVEL: z.string().default("info"),
  COOKIE_SECURE: z.enum(["true", "false"]).optional(),
});

const parsed = schema.parse(process.env);
const mongoUri = parsed.MONGODB_URI ?? parsed.DATABASE_URL;
if (!mongoUri) throw new Error("MONGODB_URI (or DATABASE_URL) is required.");
if (parsed.NODE_ENV === "production" && !parsed.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET with at least 32 characters is required in production.",
  );
}

export const env = {
  nodeEnv: parsed.NODE_ENV,
  mongoUri,
  port: parsed.BACKEND_PORT,
  frontendOrigins: parsed.FRONTEND_URL.split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  publicApiUrl: (
    parsed.PUBLIC_API_URL ?? `http://localhost:${parsed.BACKEND_PORT}`
  ).replace(/\/$/, ""),
  jwtSecret: parsed.JWT_SECRET ?? "development-only-secret-change-me-now",
  uploadDir: path.resolve(
    parsed.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"),
  ),
  logLevel: parsed.LOG_LEVEL,
  isProduction: parsed.NODE_ENV === "production",
  cookieSecure: parsed.COOKIE_SECURE
    ? parsed.COOKIE_SECURE === "true"
    : parsed.NODE_ENV === "production",
};
