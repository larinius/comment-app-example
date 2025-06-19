import type { Db } from "mongodb";
import pino from "pino";
interface LogDocument {
  logLevel: string;
  group: string;
  message: string;
  data?: any;
  timestamp: Date;
}
export const createLoggerService = (db: Db) => {
  const logsCollection = db.collection<LogDocument>("logs");

  const logger = pino({
    level: "info",
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
      },
    },
  });

  const logToDb = async (logLevel: string, group: string, message: string, data?: any) => {
    try {
      await logsCollection.insertOne({
        logLevel,
        group,
        message,
        data,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`Error logging to database: ${(error as Error).message}`);
    }
  };

  const getCurrentFunctionName = () => {
    const error = new Error();
    const stack = error.stack?.split("\n");
    if (stack && stack.length > 3) {
      const caller = stack[3].trim();
      const match = caller.match(/at\s(?:async\s)?([^\s]+)\s/);
      if (match) {
        return match[1];
      }
    }
    return "unknown";
  };

  const dbLogger = {
    info: (message: string, data?: any) => {
      const group = getCurrentFunctionName();
      logger.info(data ? { message, ...data } : message);
      logToDb("info", group, message, data);
    },
    warn: (message: string, data?: any) => {
      const group = getCurrentFunctionName();
      logger.warn(data ? { message, ...data } : message);
      logToDb("warn", group, message, data);
    },
    error: (message: string, data?: any) => {
      const group = getCurrentFunctionName();
      logger.error(data ? { message, ...data } : message);
      logToDb("error", group, message, data);
    },
    debug: (message: string, data?: any) => {
      const group = getCurrentFunctionName();
      logger.debug(data ? { message, ...data } : message);
      logToDb("debug", group, message, data);
    },
    fatal: (message: string, data?: any) => {
      const group = getCurrentFunctionName();
      logger.fatal(data ? { message, ...data } : message);
      logToDb("fatal", group, message, data);
    },
  };

  return dbLogger;
};

export type DbLogger = ReturnType<typeof createLoggerService>;
