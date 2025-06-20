import { useQuery } from "@apollo/client";
import { format } from "date-fns";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import ModalImage from "react-modal-image";
import { GET_COMMENTS_BY_IDS } from "../graphql/queries";
import { useCommentSubmission } from "../hooks/useCommentSubmission";
import type { CommentData } from "../types/types";
import { ViewContent } from "./CommentContent";
import SubmitForm from "./SubmitForm";

interface CommentBlockProps {
  comment: CommentData;
  depth: number;
  onReplySubmitted?: () => void;
  expandedCommentIds: Set<string>;
  onToggleExpand: (commentId: string) => void;
  forceExpand?: boolean;
}

const CommentBlock: React.FC<CommentBlockProps> = ({
  comment,
  depth = 0,
  onReplySubmitted,
  expandedCommentIds,
  onToggleExpand,
  forceExpand = true,
}) => {
  const { submitComment } = useCommentSubmission();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replies, setReplies] = useState<CommentData[]>([]);
  const isExpanded = forceExpand || expandedCommentIds.has(comment.id);

  const { loading, error, data } = useQuery(GET_COMMENTS_BY_IDS, {
    variables: { ids: comment.replyIds || [] },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    skip: !isExpanded || !comment.replyIds?.length,
  });

  useEffect(() => {
    if (data?.commentsByIds) setReplies(data.commentsByIds);
  }, [data]);

  const handleSubmit = async (
    text: string,
    options?: {
      file?: File;
      captchaToken?: string;
      captchaSolution?: string;
    },
  ) => {
    if (!text.trim()) return;

    await submitComment(text, {
      parentId: comment.id,
      file: options?.file,
      captchaToken: options?.captchaToken,
      captchaSolution: options?.captchaSolution,
      onSuccess: () => {
        setShowReplyForm(false);
        onReplySubmitted?.();
      },
    });
  };

  return (
    <div className={`w-full ${depth > 0 ? "mt-0" : ""}`}>
      <div className="flex w-full">
        {depth > 0 && <div className="w-2 flex-shrink-0" />}

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start space-x-4">
              {comment.author?.avatar?.signedUrl ? (
                <img
                  src={comment.author.avatar.signedUrl}
                  alt={`${comment.author.username || "User"}'s avatar`}
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="flex-shrink-0 bg-indigo-100 text-indigo-800 rounded-full w-10 h-10 flex items-center justify-center font-medium">
                  {comment.author?.username?.charAt(0) || "A"}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-gray-900">{comment.author?.username || "Anonymous"}</h3>
                    <span className="text-xs text-gray-500">{format(new Date(parseInt(comment.createdAt)), "dd.MM.yy HH:mm")}</span>
                    {depth > 0 && <span className="text-xs text-gray-400">(reply)</span>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowReplyForm(!showReplyForm)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Reply
                    </button>
                  </div>
                </div>
                <div className="mt-1 text-sm text-gray-700">
                  <ViewContent content={comment.content} />
                </div>

                {comment.attachments?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {comment.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="relative overflow-hidden rounded-md border border-gray-200 hover:border-indigo-300 transition-all duration-200"
                      >
                        {/\.(jpg|jpeg|png|gif|webp)$/i.test(attachment.filename) ? (
                          <ModalImage
                            small={attachment.signedUrl}
                            large={attachment.signedUrl}
                            alt={attachment.filename}
                            hideDownload
                            hideZoom={false}
                            className="object-cover w-[100px] h-[100px] cursor-pointer transition-opacity duration-300 hover:opacity-90"
                            imageBackgroundColor="transparent"
                          />
                        ) : (
                          <a
                            href={attachment.signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                            title={attachment.filename}
                          >
                            {/\.(txt|md|text)$/i.test(attachment.filename) ? (
                              <>
                                <span className="mr-1">📄</span>
                                <span className="truncate max-w-[120px]">Text file</span>
                              </>
                            ) : (
                              <>
                                <span className="mr-1">📎</span>
                                <span className="truncate max-w-[120px]">Download</span>
                              </>
                            )}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {showReplyForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <SubmitForm onSubmit={handleSubmit} />
              </motion.div>
            )}
          </div>

          {isExpanded && (
            <div className="mt-3">
              {error && <div className="text-red-500 text-sm px-4 py-2 bg-red-50 rounded-md">Error loading replies</div>}
              {replies.map((reply) => (
                <CommentBlock
                  key={reply.id}
                  comment={reply}
                  depth={depth + 1}
                  onReplySubmitted={onReplySubmitted}
                  expandedCommentIds={expandedCommentIds}
                  onToggleExpand={onToggleExpand}
                  forceExpand={isExpanded}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentBlock;
