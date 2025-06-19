import { gql } from "@apollo/client";

export const CREATE_COMMENT = gql`
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
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
    }
  }
`;

export const REGISTER_USER = gql`
  mutation Register($input: CreateUserInput!) {
    createUser(input: $input) {
      token
      user {
        id
        email
        username
        avatar {
          signedUrl
        }
      }
    }
  }
`;

export const LOGIN_USER = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        username
      }
    }
  }
`;

export const LOGOUT_USER = gql`
  mutation Logout {
    logout
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
