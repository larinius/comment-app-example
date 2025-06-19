import type { GraphQLContext } from "@/server/types/context";
import type { DbLogger } from "@/service/loggerService";

import { GraphQLError } from "graphql";
import { GraphQLUpload } from "graphql-upload-ts";
import type { Db } from "mongodb";
import { AttachmentService } from "./Attachment.service";

interface FileUpload {
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => NodeJS.ReadableStream;
}

export const createAttachmentResolvers = (db: Db, logger: DbLogger) => {
  const attachmentService = new AttachmentService(logger);

  return {
    Upload: GraphQLUpload,

    Query: {
      getAttachmentUrl: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
        if (!context.user) {
          throw new GraphQLError("Unauthorized");
        }

        try {
          return await attachmentService.generateSignedUrl(id);
        } catch (error) {
          logger.error("Failed to get attachment URL", { error });
          throw new GraphQLError("Failed to retrieve file URL");
        }
      },
    },

    Mutation: {
      uploadAttachment: async (_: unknown, { file }: { file: Promise<FileUpload> }, context: GraphQLContext) => {
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
          const attachment = await attachmentService.uploadFile(context.user.id, {
            buffer,
            mimetype,
            filename: filename,
          });

          return {
            ...attachment,
            id: attachment.s3Key,
            fileName: attachment.filename,
            fileSize: attachment.size,
          };
        } catch (error) {
          logger.error("Attachment upload failed", { error });
          throw error instanceof Error ? new GraphQLError(error.message) : new GraphQLError("File upload failed");
        }
      },
    },
  };
};
