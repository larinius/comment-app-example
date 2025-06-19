import { ObjectId } from "mongodb";

export interface Attachment {
  s3Key: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export interface FileUpload {
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => NodeJS.ReadableStream;
}

export interface ProcessedFile {
  buffer: Buffer;
  filename: string;
  mimetype: string;
}
