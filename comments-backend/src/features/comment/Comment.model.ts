import { ObjectId } from "mongodb";

export interface CommentDocument {
  _id?: ObjectId;
  content: string;
  authorId: ObjectId;
  parentId?: ObjectId;
  attachments?: {
    s3Key: string;
    filename: string;
    mimeType: string;
    size: number;
    uploadedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export const CommentSchema = {
  content: { type: String, required: true },
  authorId: { type: ObjectId, required: true, ref: "users" },
  parentId: { type: ObjectId, ref: "comments" },
  attachments: {
    type: [
      {
        s3Key: String,
        filename: String,
        mimeType: String,
        size: Number,
        uploadedAt: Date,
      },
    ],
    default: [],
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
};
