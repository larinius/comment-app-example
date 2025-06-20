import type { GraphQLContext } from "@/server/types/context";
import type { DbLogger } from "@/service/loggerService";
import type { Services } from "@/service/types/services.interfaces";
import { GraphQLError } from "graphql";
import type { RedisPubSub } from "graphql-redis-subscriptions";
import { GraphQLUpload } from "graphql-upload-ts";
import { type Db, ObjectId } from "mongodb";
import { AttachmentService } from "../attachment/Attachment.service";
import type { Attachment } from "../attachment/types/attachment.interfaces";
import { NotificationService } from "../notification/Notification.service";
import { UserService } from "../user/User.service";
import { CommentService } from "./Comment.service";
import type { CreateCommentInput } from "./types/comment.interfaces";
import { CaptchaService } from "../captcha/Captcha.service";

export const createCommentResolvers = (db: Db, logger: DbLogger, pubsub: RedisPubSub) => {
  const services: Services = {
    commentService: new CommentService(db),
    userService: new UserService(db),
    attachmentService: new AttachmentService(logger),
    notificationService: new NotificationService(db, pubsub),
    captchaService: new CaptchaService(),
  };

  const mapAttachments = async (attachments: Attachment[]) => {
    if (!attachments || attachments.length === 0) return null;
    return Promise.all(
      attachments.map(async (attachment) => ({
        id: attachment.s3Key,
        filename: attachment.filename,
        signedUrl: await services.attachmentService.generateSignedUrl(attachment.s3Key),
        mimetype: attachment.mimeType,
        size: attachment.size,
        createdAt: attachment.uploadedAt.toISOString(),
      })),
    );
  };

  return {
    Upload: GraphQLUpload,

    Query: {
      comments: async (
        _: unknown,
        { page = 1, limit = 25, sort }: { page?: number; limit?: number; sort?: { field: string; direction: string } },
        context: GraphQLContext,
      ) => {
        const [comments, totalCount] = await Promise.all([
          services.commentService.getPaginatedRootComments(page, limit, sort),
          services.commentService.getRootCommentsCount(),
        ]);

        const commentsWithData = await Promise.all(
          comments.map(async (comment) => ({
            ...comment,
            author: {
              ...comment.author,
              avatar: comment.author.avatar
                ? {
                    id: comment.author.avatar,
                    signedUrl: await services.attachmentService.generateSignedUrl(comment.author.avatar),
                    fileName: comment.author.avatar.split("/").pop(),
                    mimeType: "image/jpeg",
                    fileSize: 0,
                  }
                : null,
            },
            attachments: await mapAttachments(comment.attachments),
          })),
        );

        return {
          totalCount,
          comments: commentsWithData,
        };
      },

      comment: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
        const comment = await services.commentService.getCommentById(id);
        if (!comment) return null;

        const avatarUrl = comment.author.avatar ? await services.attachmentService.generateSignedUrl(comment.author.avatar) : null;

        return {
          ...comment,
          parentId: comment.parentId ? comment.parentId.toString() : null,
          author: {
            ...comment.author,
            avatar: comment.author.avatar
              ? {
                  id: comment.author.avatar,
                  signedUrl: avatarUrl,
                  fileName: comment.author.avatar.split("/").pop(),
                  mimeType: "image/jpeg",
                  fileSize: 0,
                }
              : null,
          },
          attachments: await mapAttachments(comment.attachments),
        };
      },

      commentsByIds: async (_: unknown, { ids }: { ids: string[] }, context: GraphQLContext) => {
        const comments = await services.commentService.getCommentsByIds(ids);
        return Promise.all(
          comments.map(async (comment) => ({
            ...comment,
            author: {
              ...comment.author,
              avatar: comment.author.avatar
                ? {
                    id: comment.author.avatar,
                    signedUrl: await services.attachmentService.generateSignedUrl(comment.author.avatar),
                    fileName: comment.author.avatar.split("/").pop(),
                    mimeType: "image/jpeg",
                    fileSize: 0,
                  }
                : null,
            },
            attachments: await mapAttachments(comment.attachments),
          })),
        );
      },
    },

    Mutation: {
      createComment: async (_: unknown, { input }: { input: CreateCommentInput }, context: GraphQLContext) => {
        if (!context.user) throw new GraphQLError("Unauthorized");

        if (!input.captchaToken || !input.captchaSolution) {
          throw new GraphQLError("CAPTCHA verification required");
        }

        const isValidCaptcha = await context.captchaService.verifyCaptcha(input.captchaToken, input.captchaSolution);

        if (!isValidCaptcha) {
          throw new GraphQLError("Invalid CAPTCHA solution");
        }

        try {
          let attachment: Attachment | undefined;
          if (input.file) {
            const fileUpload = await input.file;
            const processed = await services.attachmentService.processFileUpload(fileUpload);
            attachment = await services.attachmentService.uploadFile(context.user.id, processed);
          }

          const comment = await services.commentService.createComment(
            input.content,
            context.user.id,
            input.parentId,
            attachment ? [attachment] : undefined,
          );

          const notificationId = new ObjectId().toString();

          if (input.parentId) {
            const parentComment = await services.commentService.getCommentById(input.parentId);
            if (parentComment && parentComment.author.id !== context.user.id) {
              await context.notificationService.createNotification(
                parentComment.author.id,
                comment.id,
                `${context.user.username} replied to your comment`,
              );

              context.pubsub.publish("NOTIFICATION_ADDED", {
                notificationAdded: {
                  id: notificationId,
                  userId: parentComment.author.id,
                  message: `${context.user.username} replied to your comment`,
                  commentId: comment.id,
                  read: false,
                  createdAt: new Date().toISOString(),
                },
              });
            }
          } else {
            const users = await context.db
              .collection("users")
              .find({ _id: { $ne: new ObjectId(context.user.id) } })
              .toArray();

            const username = context.user.username;

            await Promise.all(
              users.map(async (user) => {
                await context.notificationService.createNotification(user._id.toString(), comment.id, `${username} posted a new comment`);

                context.pubsub.publish("NOTIFICATION_ADDED", {
                  notificationAdded: {
                    id: notificationId,
                    userId: user._id.toString(),
                    message: `${username} posted a new comment`,
                    commentId: comment.id,
                    read: false,
                    createdAt: new Date().toISOString(),
                  },
                });
              }),
            );
          }

          const avatarUrl = comment.author.avatar ? await services.attachmentService.generateSignedUrl(comment.author.avatar) : null;

          return {
            ...comment,
            author: {
              ...comment.author,
              avatar: comment.author.avatar
                ? {
                    id: comment.author.avatar,
                    signedUrl: avatarUrl,
                    fileName: comment.author.avatar.split("/").pop(),
                    mimeType: "image/jpeg",
                    fileSize: 0,
                  }
                : null,
            },
            attachments: await mapAttachments(comment.attachments || []),
          };
        } catch (error) {
          logger.error("Comment creation failed", error);
          throw new GraphQLError(error instanceof Error ? error.message : "Comment creation failed");
        }
      },
    },

    Comment: {},
  };
};
