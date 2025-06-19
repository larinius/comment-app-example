import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import CommentBlock from "./CommentItem";
import { GET_ROOT_COMMENTS } from "../graphql/queries";
import { useNotifications } from "../context/NotificationContext";
import LoadingBar from "./LoadingBar";
import { motion, AnimatePresence } from "framer-motion";
import type { CommentData } from "../types/types";

const CommentsView = () => {
  const { addToast } = useNotifications();
  const [sortField, setSortField] = useState<"CREATED_AT" | "EMAIL" | "USERNAME">("CREATED_AT");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCommentIds, setExpandedCommentIds] = useState<Set<string>>(new Set());

  const commentsPerPage = 25;

  const { loading, error, data, refetch } = useQuery(GET_ROOT_COMMENTS, {
    variables: {
      page: currentPage,
      limit: commentsPerPage,
      sort: {
        field: sortField,
        direction: sortDirection,
      },
    },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const comments = data?.comments?.comments || [];
  const totalCount = data?.comments?.totalCount || 0;

  const toggleExpand = (commentId: string) => {
    setExpandedCommentIds((prev) => {
      const newSet = new Set(prev);
      newSet.has(commentId) ? newSet.delete(commentId) : newSet.add(commentId);
      return newSet;
    });
  };

  const handleSort = (field: "CREATED_AT" | "EMAIL" | "USERNAME") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
    } else {
      setSortField(field);
      setSortDirection("DESC");
    }
    setCurrentPage(1);
  };

  const handleReplySubmitted = () => {
    addToast("Reply posted successfully!", "success");
    refetch();
  };

  const totalPages = Math.ceil(totalCount / commentsPerPage);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mt-6 flex flex-col min-h-[300px]">
      {/* Sorting controls - always visible */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-500">Sort by:</span>
          <button
            onClick={() => handleSort("CREATED_AT")}
            className={`cursor-pointer text-sm font-medium ${
              sortField === "CREATED_AT" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Date {sortField === "CREATED_AT" && (sortDirection === "ASC" ? "↑" : "↓")}
          </button>
          <button
            onClick={() => handleSort("EMAIL")}
            className={`cursor-pointer text-sm font-medium ${
              sortField === "EMAIL" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Email {sortField === "EMAIL" && (sortDirection === "ASC" ? "↑" : "↓")}
          </button>
          <button
            onClick={() => handleSort("USERNAME")}
            className={`cursor-pointer text-sm font-medium ${
              sortField === "USERNAME" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Name {sortField === "USERNAME" && (sortDirection === "ASC" ? "↑" : "↓")}
          </button>
        </div>
      </div>

      {/* Comments list container - always visible */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Loading state - shows only when initial loading */}
        {loading && comments.length === 0 ? (
          <LoadingBar />
        ) : error ? (
          <div className="p-4 text-center text-red-500">Error loading comments: {error.message}</div>
        ) : comments.length > 0 ? (
          <>
            <AnimatePresence>
              {comments.map((comment: CommentData) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.2,
                    ease: "easeOut",
                  }}
                >
                  <CommentBlock
                    comment={comment}
                    depth={0}
                    onReplySubmitted={handleReplySubmitted}
                    expandedCommentIds={expandedCommentIds}
                    onToggleExpand={toggleExpand}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && comments.length > 0 && <LoadingBar />}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">No comments yet. Be the first to comment!</div>
        )}
      </div>

      {/* Pagination - always visible */}
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex-1 flex justify-between items-center">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || loading}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || loading}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentsView;
