export const attachmentTypeDefs = `
  type Attachment {
    id: ID!
    filename: String!
    signedUrl: String!
    mimetype: String!
    size: Int!
    createdAt: String!
  }

  input FileUpload {
    filename: String!
    mimetype: String!
    encoding: String!
  }

  type Query {
    getAttachmentUrl(id: ID!): String!
  }

  type Mutation {
    uploadAttachment(file: Upload!): Attachment!
  }
`;
