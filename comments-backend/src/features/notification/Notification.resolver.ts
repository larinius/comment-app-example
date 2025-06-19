import type { GraphQLContext } from "@/server/types/context";
import { GraphQLError } from "graphql";
import type { RedisPubSub } from "graphql-redis-subscriptions";
import { withFilter } from "graphql-subscriptions";
import type { Db } from "mongodb";
import { ObjectId } from "mongodb";
import { NotificationService } from "./Notification.service";
import { NotificationAddedPayload } from "./types/notification.interfaces";

export const createNotificationResolvers = (db: Db, pubsub: RedisPubSub) => {
  const notificationService = new NotificationService(db, pubsub);

  return {
    Query: {
      unreadNotifications: async (_: unknown, __: unknown, context: GraphQLContext) => {
        if (!context?.user) throw new GraphQLError("Unauthorized");
        const notifications = await notificationService.getUnreadNotifications(context.user.id);
        return notifications.map((notif) => ({
          id: notif._id.toString(),
          message: notif.message,
          commentId: notif.commentId.toString(),
          read: notif.read,
          createdAt: notif.createdAt.toISOString(),
          userId: notif.userId.toString(),
        }));
      },
    },

    Mutation: {
      markNotificationAsRead: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
        if (!context?.user) throw new GraphQLError("Unauthorized");
        await notificationService.markAsRead(id);
        return true;
      },
    },

    Subscription: {
      notificationAdded: {
        subscribe: withFilter<NotificationAddedPayload, any, GraphQLContext | undefined>(
          () => pubsub.asyncIterator("NOTIFICATION_ADDED"),
          (payload, _variables, context) => {
            return payload?.notificationAdded?.userId === context?.user?.id;
          },
        ),
        resolve: (payload: NotificationAddedPayload) => {
          return (
            payload?.notificationAdded || {
              id: new ObjectId().toString(),
              message: "New notification",
              commentId: new ObjectId().toString(),
              read: false,
              createdAt: new Date().toISOString(),
              userId: "",
            }
          );
        },
      },
    },
  };
};
