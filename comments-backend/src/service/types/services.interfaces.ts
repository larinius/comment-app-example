import type { AttachmentService } from "@/features/attachment/Attachment.service";
import type { CommentService } from "@/features/comment/Comment.service";
import type { NotificationService } from "@/features/notification/Notification.service";
import type { UserService } from "@/features/user/User.service";

export interface Services {
  commentService: CommentService;
  userService: UserService;
  attachmentService: AttachmentService;

  notificationService: NotificationService;
}
