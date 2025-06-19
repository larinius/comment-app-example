import type { GraphQLContext } from "@/server/types/context";
import type { DbLogger } from "@/service/loggerService";
import { GraphQLError } from "graphql/error/GraphQLError";
import type { Db } from "mongodb";
import { AttachmentService } from "../attachment/Attachment.service";
import { UserService } from "./User.service";
import type { CreateUserInput, LoginInput } from "./types/user.interfaces";

interface UserServices {
  userService: UserService;
}

export const createUserResolvers = (db: Db, logger: DbLogger) => {
  const services: UserServices = {
    userService: new UserService(db),
  };
  const userService = new UserService(db);
  const attachmentService = new AttachmentService(logger);

  return {
    Query: {
      currentUser: async (_: unknown, __: unknown, context: GraphQLContext) => {
        if (!context.user) return null;
        const user = await userService.findById(context.user.id);

        if (!user) return null;
        if (user.avatarKey) {
          const signedUrl = await attachmentService.generateSignedUrl(user.avatarKey);
          return {
            ...user,
            avatar: {
              signedUrl,
            },
          };
        }

        return user;
      },
      user: (_: unknown, { id }: { id: string }) => {
        return services.userService.findById(id);
      },
    },
    Mutation: {
      createUser: async (_: unknown, { input }: { input: CreateUserInput }) => {
        try {
          const result = await services.userService.createUser(input.email, input.username, input.password);

          if (input.avatar) {
            const file = await input.avatar;
            const processed = await attachmentService.processFileUpload(file);
            const avatar = await attachmentService.uploadAvatar(result.user.id, processed);

            await services.userService.setAvatar(result.user.id, avatar.id);

            return {
              token: result.token,
              user: {
                ...result.user,
                avatar: {
                  id: avatar.id,
                  signedUrl: avatar.signedUrl,
                  fileName: avatar.fileName,
                  mimeType: avatar.mimeType,
                  fileSize: avatar.fileSize,
                },
              },
            };
          }

          return result;
        } catch (error) {
          logger.error("Registration failed", error);
          throw new GraphQLError(error instanceof Error ? error.message : "Registration failed");
        }
      },
      login: async (_: unknown, { input }: { input: LoginInput }) => {
        const result = await services.userService.login(input.email, input.password);
        return {
          token: result.token,
          user: result.user,
        };
      },
      logout: async (_: unknown, __: unknown, context: GraphQLContext) => {
        if (!context.token) throw new Error("Not authenticated");
        return services.userService.logout(context.token);
      },

      uploadAvatar: async (_: unknown, { file }: { file: Promise<any> }, context: GraphQLContext) => {
        if (!context.user) {
          throw new GraphQLError("Unauthorized");
        }

        try {
          const { createReadStream, filename, mimetype } = await file;
          const stream = createReadStream();
          const chunks: Buffer[] = [];

          for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }

          const buffer = Buffer.concat(chunks);
          const avatar = await attachmentService.uploadAvatar(context.user.id, {
            buffer,
            mimetype,
            filename: filename,
          });

          await services.userService.setAvatar(context.user.id, avatar.id);

          return {
            id: avatar.id,
            signedUrl: avatar.signedUrl,
            fileName: avatar.fileName,
            mimeType: avatar.mimeType,
            fileSize: avatar.fileSize,
          };
        } catch (error) {
          logger.error("Avatar upload failed", { error });
          throw error instanceof Error ? new GraphQLError(error.message) : new GraphQLError("Avatar upload failed");
        }
      },
    },
    User: {
      createdAt: (parent: { createdAt: Date }) => parent.createdAt.toISOString(),
      updatedAt: (parent: { updatedAt: Date }) => parent.updatedAt.toISOString(),
    },
  };
};
