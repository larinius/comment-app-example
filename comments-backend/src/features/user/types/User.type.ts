export const userTypeDefs = `
  type Avatar {
    id: ID!
    signedUrl: String!
    fileName: String!
    mimeType: String!
    fileSize: Int!
  }

  type User {
    id: ID!
    email: String!
    username: String!
    avatar: Avatar
    createdAt: String!
    updatedAt: String!
  }

  type AvatarUploadResult {
    id: ID!
    signedUrl: String!
    fileName: String!
    mimeType: String!
    fileSize: Int!
  }

  input CreateUserInput {
    email: String!
    username: String!
    password: String!
    avatar: Upload
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    currentUser: User
    user(id: ID!): User
  }

  type Mutation {
    createUser(input: CreateUserInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout: Boolean!
    uploadAvatar(file: Upload!): Avatar!
  }
`;
