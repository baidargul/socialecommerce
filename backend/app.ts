import fs from "node:fs";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { authenticate } from "./middleware/auth";
import { accountRouter } from "./routes/account.routes";
import { authRouter } from "./routes/auth.routes";
import { catalogRouter } from "./routes/catalog.routes";
import { commerceRouter } from "./routes/commerce.routes";
import { dashboardRouter } from "./routes/dashboard.routes";
import { socialRouter } from "./routes/social.routes";
import { errorHandler, notFound, requestContext, success } from "./utils/http";
import { logger } from "./utils/logger";

export function createApp() {
  const app = express();
  fs.mkdirSync(env.uploadDir, { recursive: true });
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(requestContext);
  app.use(pinoHttp({ logger }));
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin(origin, done) {
        if (!origin || env.frontendOrigins.includes(origin))
          return done(null, true);
        done(new Error("Origin is not allowed by CORS."));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());
  app.use(authenticate);
  app.use(
    "/uploads",
    express.static(env.uploadDir, { immutable: true, maxAge: "7d" }),
  );
  app.get("/health", (req, res) => success(req, res, { status: "ok" }));
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/account", accountRouter);
  app.use("/api/v1", socialRouter);
  app.use("/api/v1", catalogRouter);
  app.use("/api/v1", commerceRouter);
  app.use("/api/v1/dashboard", dashboardRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
