import { useMutation, useQuery } from "@apollo/client";
import { CREATE_COMMENT } from "../graphql/mutations";
import { GET_ROOT_COMMENTS, GET_COMMENTS_BY_IDS, GET_COMMENT } from "../graphql/queries";
import { useNotifications } from "../context/NotificationContext";
import { useApolloClient } from "@apollo/client";

export const useCommentSubmission = () => {
  const [createComment] = useMutation(CREATE_COMMENT);
  const { addToast } = useNotifications();

  const client = useApolloClient();

  const submitComment = async (
    content: string,
    options?: {
      parentId?: string;
      file?: File;
      onSuccess?: () => void;
    },
  ) => {
    try {
      const input: any = {
        content,
        ...(options?.parentId && { parentId: options.parentId }),
        ...(options?.file && { file: options.file }),
      };

      await createComment({
        variables: { input },
        refetchQueries: options?.parentId
          ? [
              {
                query: GET_ROOT_COMMENTS,
                variables: {
                  page: 1,
                  limit: 25,
                  sort: {
                    field: "CREATED_AT",
                    direction: "DESC",
                  },
                },
              },
              {
                query: GET_COMMENTS_BY_IDS,
                variables: { ids: [options.parentId] },
              },
            ]
          : [
              {
                query: GET_ROOT_COMMENTS,
                variables: {
                  page: 1,
                  limit: 25,
                  sort: {
                    field: "CREATED_AT",
                    direction: "DESC",
                  },
                },
              },
            ],
      });

      addToast(options?.parentId ? "Reply posted successfully!" : "Comment posted successfully!", "success");

      options?.onSuccess?.();
    } catch (err) {
      addToast(options?.parentId ? "Error posting reply" : "Error posting comment", "error");
      console.error("Error:", err);
      throw err;
    }
  };

  const refetchAll = async (commentId?: string) => {
    await client.query({
      query: GET_ROOT_COMMENTS,
      variables: {
        page: 1,
        limit: 25,
        sort: { field: "CREATED_AT", direction: "DESC" },
      },
      fetchPolicy: "network-only",
    });

    if (commentId) {
      const { data } = await client.query({
        query: GET_COMMENT,
        variables: { id: commentId },
        fetchPolicy: "network-only",
      });

      if (data?.comment?.parentId) {
        client.cache.modify({
          id: client.cache.identify({ id: data.comment.parentId, __typename: "Comment" }),
          fields: {
            replyIds(existing = []) {
              return existing.includes(commentId) ? existing : [...existing, commentId];
            },
          },
        });
      }
    }
  };

  return { submitComment, refetchAll };
};
