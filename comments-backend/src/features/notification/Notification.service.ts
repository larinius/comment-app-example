import type { RedisPubSub } from "graphql-redis-subscriptions";
import { ObjectId } from "mongodb";
import type { Db } from "mongodb";
import type { NotificationDocument } from "./Notification.model";

export class NotificationService {
  constructor(private db: Db, private pubsub: RedisPubSub) {}

  private get collection() {
    return this.db.collection<NotificationDocument>("notifications");
  }

  async createNotification(userId: string, commentId: string, message: string) {
    const notification: NotificationDocument = {
      userId: new ObjectId(userId),
      commentId: new ObjectId(commentId),
      message,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection.insertOne(notification);
    return result.insertedId.toString();
  }

  async getUnreadNotifications(userId: string) {
    return this.collection
      .find({
        userId: new ObjectId(userId),
        read: false,
      })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async markAsRead(notificationId: string) {
    await this.collection.updateOne({ _id: new ObjectId(notificationId) }, { $set: { read: true, updatedAt: new Date() } });
  }
}
