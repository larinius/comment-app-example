import { gql } from "@apollo/client";

export const NOTIFICATION_SUBSCRIPTION = gql`
  subscription OnNotificationAdded {
    notificationAdded {
      id
      message
      commentId
      read
      createdAt
    }
  }
`;

export const MARK_AS_READ = gql`
  mutation MarkAsRead($id: ID!) {
    markNotificationAsRead(id: $id)
  }
`;

export const GET_UNREAD_NOTIFICATIONS = gql`
  query UnreadNotifications {
    unreadNotifications {
      id
      message
      commentId
      read
      createdAt
    }
  }
`;
