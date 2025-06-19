import { connectToDatabase } from "@/config/db";

import { envConfig } from "@/config/envConfig";
import { initializeServer } from "@/server";
import { logger } from "@/server";

async function startServer() {
  await connectToDatabase();
  logger.info("Database connected");

  const { httpServer } = await initializeServer();
  const { NODE_ENV, HOST, PORT } = envConfig;

  const server = httpServer.listen(PORT, () => {
    logger.info(`Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`);
    logger.info(`GraphQL endpoint: http://${HOST}:${PORT}/graphql`);
  });

  const onCloseSignal = () => {
    logger.info("sigint received, shutting down");
    server.close(() => {
      logger.info("server closed");
      process.exit();
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGINT", onCloseSignal);
  process.on("SIGTERM", onCloseSignal);
}

startServer().catch((err) => {
  logger.error(err);
  process.exit(1);
});
