import mongoose from "mongoose";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export async function connectDatabase() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10_000 });
  logger.info({ database: mongoose.connection.name }, "MongoDB connected");
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
