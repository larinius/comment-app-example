import type { NotificationService } from "@/features/notification/Notification.service";
import type { RedisPubSub } from "graphql-redis-subscriptions";
import type { Db } from "mongodb";

export interface GraphQLUser {
  id: string;
  email: string;
  username?: string;
}

export interface GraphQLContext {
  user?: GraphQLUser;
  token?: string;
  pubsub: RedisPubSub;
  db: Db;
  notificationService: NotificationService;
}
