export interface Notification {
  id: string;
  message: string;
  commentId: string;
  read: boolean;
  createdAt: string;
  userId: string;
}

export interface NotificationDocument {
  _id: string;
  userId: string;
  message: string;
  commentId: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationAddedPayload {
  notificationAdded?: {
    id: string;
    message: string;
    commentId: string;
    read: boolean;
    createdAt: string;
    userId: string;
  };
}
