export const notificationTypeDefs = `
  type Notification {
    id: ID!
    message: String!
    commentId: ID!
    read: Boolean!
    createdAt: String!
    userId: ID!
  }

  type Query {
    unreadNotifications: [Notification!]!
  }

  type Mutation {
    markNotificationAsRead(id: ID!): Boolean!
  }

  type Subscription {
    notificationAdded: Notification!
  }
`;
