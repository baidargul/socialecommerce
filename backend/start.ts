import type { Server } from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./database/connection";
import { initializeIndexes } from "./models";
import { recoverStaleCheckouts } from "./services/checkout.service";
import { logger } from "./utils/logger";

export async function startServer(): Promise<Server> {
  await connectDatabase();
  await initializeIndexes();
  await recoverStaleCheckouts();
  const recovery = setInterval(() => void recoverStaleCheckouts(), 60_000);
  recovery.unref();
  const server = createApp().listen(env.port, () =>
    logger.info({ port: env.port }, "Express API ready"),
  );
  async function shutdown(signal: string) {
    logger.info({ signal }, "Graceful shutdown started");
    clearInterval(recovery);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  }
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
  return server;
}
