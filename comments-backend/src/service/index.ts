import { createAttachmentResolvers } from "@/features/attachment/Attachment.resolver";
import { attachmentTypeDefs } from "@/features/attachment/types/Attachment.type";
import { notificationTypeDefs } from "@/features/notification/types/Notification.type";
import { mergeResolvers, mergeTypeDefs } from "@graphql-tools/merge";
import type { RedisPubSub } from "graphql-redis-subscriptions";
import type { Db } from "mongodb";
import { createCommentResolvers } from "../features/comment/Comment.resolver";
import { commentTypeDefs } from "../features/comment/types/Comment.type";
import { createNotificationResolvers } from "../features/notification/Notification.resolver";
import { createUserResolvers } from "../features/user/User.resolver";
import { userTypeDefs } from "../features/user/types/User.type";
import { createLoggerService } from "./loggerService";

export const createResolvers = (db: Db, pubsub: RedisPubSub) => {
  const logger = createLoggerService(db);
  return mergeResolvers([
    createUserResolvers(db, logger),
    createCommentResolvers(db, logger, pubsub),
    createAttachmentResolvers(db, logger),
    createNotificationResolvers(db, pubsub),
  ]);
};

export const typeDefs = mergeTypeDefs(["scalar Upload", userTypeDefs, commentTypeDefs, attachmentTypeDefs, notificationTypeDefs]);
