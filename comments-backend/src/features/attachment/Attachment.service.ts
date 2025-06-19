import type { DbLogger } from "@/service/loggerService";

import AWS from "aws-sdk";
import sharp from "sharp";
import { envConfig } from "../../config/envConfig";
import type { Avatar } from "../user/types/user.interfaces";
import type { Attachment, FileUpload, ProcessedFile } from "./types/attachment.interfaces";

export class AttachmentService {
  private s3: AWS.S3;

  constructor(private logger: DbLogger) {
    AWS.config.update({
      accessKeyId: envConfig.AWS_ACCESS_KEY_ID,
      secretAccessKey: envConfig.AWS_SECRET_ACCESS_KEY,
      region: envConfig.AWS_REGION,
    });
    this.s3 = new AWS.S3();
  }

  async processFileUpload(file: FileUpload): Promise<ProcessedFile> {
    const { createReadStream, filename, mimetype } = file;
    const stream = createReadStream();
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return {
      buffer: Buffer.concat(chunks),
      filename: filename,
      mimetype,
    };
  }

  async uploadFile(userId: string, file: ProcessedFile): Promise<Attachment> {
    try {
      this.validateFile(file);

      let processedBuffer = file.buffer;
      if (file.mimetype.startsWith("image/")) {
        const [maxWidth, maxHeight] = envConfig.MAX_IMAGE_SIZE.split("x").map(Number);
        processedBuffer = await sharp(file.buffer).resize(maxWidth, maxHeight, { fit: "inside", withoutEnlargement: true }).toBuffer();
      }

      const key = `${userId}/attachments/${Date.now()}-${file.filename}`;

      await this.s3
        .upload({
          Bucket: envConfig.AWS_S3_BUCKET_NAME,
          Key: key,
          Body: processedBuffer,
          ContentType: file.mimetype,
        })
        .promise();

      return {
        s3Key: key,
        filename: file.filename,
        mimeType: file.mimetype,
        size: processedBuffer.byteLength,
        uploadedAt: new Date(),
      };
    } catch (error) {
      this.logger.error("Failed to upload file", { error });
      throw error;
    }
  }

  private validateFile(file: { buffer: Buffer; mimetype: string; filename: string }) {
    if (file.mimetype.startsWith("image/")) {
      if (!["image/jpeg", "image/png", "image/gif"].includes(file.mimetype)) {
        throw new Error("Invalid image format. Only JPG, PNG, and GIF are allowed.");
      }
    } else if (file.mimetype === "text/plain") {
      if (file.buffer.byteLength > envConfig.MAX_TEXT_FILE_SIZE) {
        throw new Error("Text file exceeds maximum size of 100KB");
      }
      if (!file.filename.toLowerCase().endsWith(".txt")) {
        throw new Error("Text files must have .txt extension");
      }
    } else {
      throw new Error("Unsupported file type");
    }
  }

  async generateSignedUrl(s3Key: string): Promise<string> {
    try {
      return this.s3.getSignedUrl("getObject", {
        Bucket: envConfig.AWS_S3_BUCKET_NAME,
        Key: s3Key,
        Expires: 3600,
      });
    } catch (error) {
      this.logger.error("Failed to generate signed URL", { error });
      throw error;
    }
  }

  async uploadAvatar(userId: string, file: ProcessedFile): Promise<Avatar> {
    try {
      this.validateAvatarFile(file);

      const processedBuffer = await sharp(file.buffer).resize(300, 300, { fit: "cover" }).toBuffer();

      const key = `${userId}/avatars/${Date.now()}-${file.filename}`;
      const signedUrl = await this.generateSignedUrl(key);

      await this.s3
        .upload({
          Bucket: envConfig.AWS_S3_BUCKET_NAME,
          Key: key,
          Body: processedBuffer,
          ContentType: file.mimetype,
        })
        .promise();

      return {
        id: key,
        signedUrl,
        fileName: file.filename,
        mimeType: file.mimetype,
        fileSize: processedBuffer.byteLength,
      };
    } catch (error) {
      this.logger.error("Failed to upload avatar", { error });
      throw error;
    }
  }

  private validateAvatarFile(file: { buffer: Buffer; mimetype: string }) {
    if (!file.mimetype.startsWith("image/")) {
      throw new Error("Only image files are allowed for avatars");
    }
    if (!["image/jpeg", "image/png"].includes(file.mimetype)) {
      throw new Error("Invalid image format. Only JPG and PNG are allowed for avatars.");
    }
  }
}
