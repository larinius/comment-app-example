import type { FileUpload } from "@/features/attachment/types/attachment.interfaces";

export interface CreateCommentInput {
  content: string;
  parentId?: string;
  file?: FileUpload;
}
