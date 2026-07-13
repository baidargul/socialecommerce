import { startServer } from "./start";
import { logger } from "./utils/logger";

startServer().catch((error) => {
  logger.fatal({ err: error }, "Backend failed to start");
  process.exit(1);
});
