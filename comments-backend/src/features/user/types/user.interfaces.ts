import type { FileUpload } from "@/features/attachment/types/attachment.interfaces";

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  username: string;
  password: string;
  avatar?: Promise<FileUpload>;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthPayload {
  token: string;
  user: User;
}

export interface AvatarUploadResult {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface Avatar {
  id: string;
  signedUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}
