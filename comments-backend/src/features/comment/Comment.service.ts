import { type Db, ObjectId } from "mongodb";
import type { Attachment } from "../attachment/types/attachment.interfaces";
import type { UserDocument } from "../user/User.model";
import type { CommentDocument } from "./Comment.model";

export class CommentService {
  constructor(private db: Db) {}

  private get collection() {
    return this.db.collection<CommentDocument>("comments");
  }

  async createComment(content: string, authorId: string, parentId?: string, attachments?: Attachment[]) {
    const authorObjectId = new ObjectId(authorId);
    const author = await this.db.collection<UserDocument>("users").findOne({ _id: authorObjectId });
    if (!author) throw new Error("Author not found");

    const comment: CommentDocument = {
      content,
      authorId: authorObjectId,
      ...(parentId && { parentId: new ObjectId(parentId) }),
      ...(attachments && {
        attachments: attachments.map((attachment) => ({
          s3Key: attachment.s3Key,
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          size: attachment.size,
          uploadedAt: attachment.uploadedAt,
        })),
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection.insertOne(comment);
    return {
      ...comment,
      id: result.insertedId.toString(),
      parentId: parentId || null,
      author: {
        id: authorId,
        username: author.username,
        email: author.email,
        avatar: author.avatar || null,
      },
      attachments: comment.attachments || null,
    };
  }

  async getPaginatedRootComments(page = 1, limit = 25, sort?: { field: string; direction: string }) {
    const skip = (page - 1) * limit;
    const sortOptions = this.getSortOptions(sort);

    const comments = await this.collection
      .aggregate([
        { $match: { parentId: { $exists: false } } },
        {
          $lookup: {
            from: "users",
            localField: "authorId",
            foreignField: "_id",
            as: "author",
          },
        },
        { $unwind: "$author" },
        {
          $lookup: {
            from: "comments",
            let: { parentId: "$_id" },
            pipeline: [{ $match: { $expr: { $eq: ["$parentId", "$$parentId"] } } }, { $project: { _id: 1 } }],
            as: "replyIds",
          },
        },
        { $sort: sortOptions },
        { $skip: skip },
        { $limit: limit },
      ])
      .toArray();

    return comments.map((comment) => ({
      id: comment._id.toString(),
      content: comment.content,
      createdAt: comment.createdAt,
      author: {
        id: comment.author._id.toString(),
        username: comment.author.username,
        email: comment.author.email,
        avatar: comment.author.avatar || null,
      },
      attachments:
        comment.attachments?.map((att: any) => ({
          s3Key: att.s3Key,
          filename: att.filename,
          mimeType: att.mimeType,
          size: att.size,
          uploadedAt: att.uploadedAt,
        })) || [],
      replyIds: comment.replyIds.map((r: any) => r._id.toString()),
    }));
  }

  async getCommentById(id: string) {
    const [comment] = await this.collection
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: "users",
            localField: "authorId",
            foreignField: "_id",
            as: "author",
          },
        },
        { $unwind: "$author" },
        {
          $lookup: {
            from: "comments",
            let: { parentId: "$_id" },
            pipeline: [{ $match: { $expr: { $eq: ["$parentId", "$$parentId"] } } }, { $project: { _id: 1 } }],
            as: "replyIds",
          },
        },
      ])
      .toArray();

    if (!comment) return null;

    return {
      id: comment._id.toString(),
      content: comment.content,
      createdAt: comment.createdAt,
      parentId: comment.parentId?.toString(),
      author: {
        id: comment.author._id.toString(),
        username: comment.author.username,
        email: comment.author.email,
        avatar: comment.author.avatar || null,
      },
      attachments:
        comment.attachments?.map((att: any) => ({
          s3Key: att.s3Key,
          filename: att.filename,
          mimeType: att.mimeType,
          size: att.size,
          uploadedAt: att.uploadedAt,
        })) || [],
      replyIds: comment.replyIds?.map((r: any) => r._id.toString()) || [],
    };
  }

  async getCommentsByIds(ids: string[]) {
    if (!ids.length) return [];

    const comments = await this.collection
      .aggregate([
        {
          $match: {
            _id: {
              $in: ids
                .map((id) => {
                  try {
                    return new ObjectId(id);
                  } catch {
                    return null;
                  }
                })
                .filter(Boolean),
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "authorId",
            foreignField: "_id",
            as: "author",
          },
        },
        { $unwind: "$author" },
        {
          $lookup: {
            from: "comments",
            let: { parentId: "$_id" },
            pipeline: [{ $match: { $expr: { $eq: ["$parentId", "$$parentId"] } } }, { $project: { _id: 1 } }],
            as: "replyIds",
          },
        },
      ])
      .toArray();

    return comments.map((comment) => ({
      id: comment._id.toString(),
      content: comment.content,
      createdAt: comment.createdAt,
      author: {
        id: comment.author._id.toString(),
        username: comment.author.username,
        email: comment.author.email,
        avatar: comment.author.avatar || null,
      },
      attachments:
        comment.attachments?.map((att: any) => ({
          id: att.s3Key,
          s3Key: att.s3Key,
          filename: att.filename,
          mimeType: att.mimeType,
          size: att.size,
          uploadedAt: att.uploadedAt,
        })) || [],
      replyIds: comment.replyIds?.map((r: any) => r._id.toString()) || [],
    }));
  }

  async getRootCommentsCount(): Promise<number> {
    return this.collection.countDocuments({ parentId: { $exists: false } });
  }

  private getSortOptions(sort?: { field: string; direction: string }) {
    if (!sort) return { createdAt: -1 };
    const sortDirection = sort.direction === "ASC" ? 1 : -1;
    switch (sort.field) {
      case "USERNAME":
        return { "author.username": sortDirection };
      case "EMAIL":
        return { "author.email": sortDirection };
      case "CREATED_AT":
        return { createdAt: sortDirection };
      default:
        return { createdAt: -1 };
    }
  }
}
