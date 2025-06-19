import { ObjectId } from "mongodb";

export interface NotificationDocument {
  _id?: ObjectId;
  userId: ObjectId;
  message: string;
  commentId: ObjectId;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = {
  userId: { type: ObjectId, required: true, ref: "users" },
  message: { type: String, required: true },
  commentId: { type: ObjectId, required: true, ref: "comments" },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
};
