export const commentTypeDefs = `
  scalar Upload

  type Attachment {
    id: ID!
    filename: String!
    signedUrl: String!
    mimetype: String!
    size: Int!
    createdAt: String!
  }

  type Comment {
    id: ID!
    content: String!
    author: User!
    parentId: ID
    createdAt: String!
    updatedAt: String!
    attachments: [Attachment!]
    replyIds: [ID!]
  }

  input CreateCommentInput {
    content: String!
    parentId: ID
    file: Upload
    captchaToken: String
    captchaSolution: String
  }

  type Mutation {
    createComment(input: CreateCommentInput!): Comment!
    updateComment(id: ID!, content: String!): Comment!
    deleteComment(id: ID!): Boolean!
  }

  type CommentConnection {
    totalCount: Int!
    comments: [Comment!]!
  }

  enum SortDirection {
    ASC
    DESC
  }

  enum CommentSortField {
    USERNAME
    EMAIL
    CREATED_AT
  }

  input CommentSortInput {
    field: CommentSortField!
    direction: SortDirection!
  }

  type Query {
    comments(page: Int, limit: Int, sort: CommentSortInput): CommentConnection!
    comment(id: ID!): Comment
    commentsByIds(ids: [ID!]!): [Comment!]!
  }



`;
