export type CommentAuthor = {
  id?: string;
  username?: string;
  email?: string;
  avatar?: {
    signedUrl?: string;
  };
};

export type CommentAttachment = {
  id?: string;
  signedUrl?: string;
  filename?: string;
};

export type CommentData = {
  id: string;
  content: string;
  createdAt: string;
  author?: CommentAuthor;
  attachments?: CommentAttachment[];
  replyIds?: string[];
  replies?: CommentData[];
  repliesCount?: number;
};
export type CommentSortField = "CREATED_AT" | "EMAIL" | "USERNAME";
export type SortDirection = "ASC" | "DESC";

export type User = {
  id?: string;
  email?: string;
  username?: string;
  avatar?: {
    signedUrl?: string;
  };
};
