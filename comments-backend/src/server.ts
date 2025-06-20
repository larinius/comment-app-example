import { createServer } from "node:http";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import express, { type Express } from "express";
import playground from "graphql-playground-middleware-express";
import { RedisPubSub } from "graphql-redis-subscriptions";
import { graphqlUploadExpress } from "graphql-upload-ts";

import { makeServer } from "graphql-ws";
import helmet from "helmet";
import { Redis } from "ioredis";
import jwt from "jsonwebtoken";
import { pino } from "pino";
import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";

import { createAuthMiddleware } from "@/common/middleware/authMiddleware";
import errorHandler from "@/common/middleware/errorHandler";
import rateLimiter from "@/common/middleware/rateLimiter";
import requestLogger from "@/common/middleware/requestLogger";
import { getDb } from "@/config/db";
import { envConfig } from "@/config/envConfig";
import { UserService } from "@/features/user/User.service";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { createApolloServer } from "./apolloServer";
import { NotificationService } from "./features/notification/Notification.service";
import { createResolvers, typeDefs } from "./service";
import { createLoggerService } from "./service/loggerService";
import { CaptchaService } from "./features/captcha/Captcha.service";

declare module "express" {
  interface Request {
    user?: {
      id: string;
      email: string;
    };
    token?: string;
  }
}

export const logger = pino({ name: "server start" });

const redis = new Redis(envConfig.REDIS_URL);
const pubsub = new RedisPubSub({
  publisher: new Redis(envConfig.REDIS_URL),
  subscriber: new Redis(envConfig.REDIS_URL),
});

export async function createApp() {
  const app: Express = express();
  const httpServer = createServer(app);

  const db = await getDb();
  const dbLogger = createLoggerService(db);

  app.use(
    graphqlUploadExpress({
      maxFileSize: 1000000, // 1MB
      maxFiles: 10,
    }),
  );
  app.set("trust proxy", true);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  const allowedOrigins = envConfig.CORS_ORIGIN.split(",").map((s) => s.trim());
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  );
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(rateLimiter);
  app.use(requestLogger);
  app.use(createAuthMiddleware(db));

  const resolvers = createResolvers(db, pubsub);

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  interface ConnectionParams {
    authorization?: string;
  }

  const gqlWsServer = makeServer({
    schema: makeExecutableSchema({ typeDefs, resolvers }),
    context: async (ctx) => {
      const params = ctx.connectionParams as ConnectionParams;
      const token = params?.authorization?.split(" ")[1];

      if (token) {
        const userService = new UserService(db);
        const isBlacklisted = await userService.isTokenBlacklisted(token);
        if (isBlacklisted) throw new Error("Token revoked");

        try {
          const decoded = jwt.verify(token, envConfig.JWT_SECRET) as {
            id: string;
            email: string;
          };
          return { user: decoded, token, pubsub };
        } catch (err) {
          throw new Error("Invalid token");
        }
      }
      return { pubsub };
    },
  });

  const clients = new Set<WebSocket>();
  wsServer.on("connection", (socket: WebSocket, request) => {
    clients.add(socket);

    const socketClosed = gqlWsServer.opened(
      {
        protocol: socket.protocol,
        send: (data) => {
          if (socket.readyState === socket.OPEN) {
            socket.send(data);
          }
        },
        close: (code, reason) => socket.close(code, reason),
        onMessage: (cb) => socket.on("message", (data) => cb(data.toString())),
      },
      request,
    );

    socket.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    socket.on("close", () => {
      clients.delete(socket);
      socketClosed();
    });
  });

  app.get("/health", (_, res) => res.status(200).json({ status: "ok" }));
  app.use(errorHandler);

  return {
    app,
    httpServer,
    logger: dbLogger,
    redis,
    pubsub,
    db,
    wsServer,
    notificationService: new NotificationService(db, pubsub),
    captchaService: new CaptchaService(),
  };
}

export async function initializeServer() {
  const { app, httpServer, logger, redis, pubsub, db, wsServer, captchaService } = await createApp();

  const resolvers = createResolvers(db, pubsub);
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const server = await createApolloServer(httpServer, wsServer, pubsub, db);

  app.use("/playground", playground({ endpoint: "/graphql" }));
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => ({
        user: req.user,
        token: req.token,
        pubsub,
        db,
        notificationService: new NotificationService(db, pubsub),
        captchaService
      }),
    }),
  );

  return { app, httpServer, logger, redis, pubsub };
}
