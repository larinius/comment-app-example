import { gql } from "@apollo/client";

export const GET_ROOT_COMMENTS = gql`
  query GetComments($page: Int, $limit: Int, $sort: CommentSortInput) {
    comments(page: $page, limit: $limit, sort: $sort) {
      totalCount
      comments {
        id
        content
        createdAt
        author {
          id
          username
          email
          avatar {
            signedUrl
          }
        }
        attachments {
          id
          signedUrl
          filename
        }
        replyIds
      }
    }
  }
`;

export const GET_COMMENTS_BY_IDS = gql`
  query GetCommentsByIds($ids: [ID!]!) {
    commentsByIds(ids: $ids) {
      id
      content
      createdAt
      author {
        id
        username
        email
        avatar {
          signedUrl
        }
      }
      attachments {
        id
        signedUrl
        filename
      }
      replyIds
    }
  }
`;

export const GET_COMMENT = gql`
  query GetComment($id: ID!) {
    comment(id: $id) {
      id
      content
      createdAt
      author {
        id
        username
        email
        avatar {
          signedUrl
        }
      }
      attachments {
        id
        signedUrl
        filename
      }
      replyIds
      parentId
    }
  }
`;

export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    currentUser {
      id
      email
      username
      avatar {
        signedUrl
      }
    }
  }
`;
