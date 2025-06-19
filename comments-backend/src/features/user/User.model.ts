import type { ObjectId } from "mongodb";

export interface UserDocument {
  _id?: ObjectId;
  email: string;
  username: string;
  avatar?: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = {
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  avatar: { type: String },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
};
