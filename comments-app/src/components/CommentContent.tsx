import React from "react";
import DOMPurify from "dompurify";
import styles from "./CommentContent.module.css";

interface ViewContentProps {
  content: string;
  className?: string;
}

const ALLOWED_TAGS = ["a", "code", "i", "strong", "p", "br"];
const ALLOWED_ATTRS = ["href", "title"];

export const ViewContent: React.FC<ViewContentProps> = ({ content, className = "" }) => {
  const processContent = (text: string): string => {
    if (!text.trim()) return "";

    return text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const sanitizedContent = DOMPurify.sanitize(processContent(content), {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTRS,
    FORBID_TAGS: ["style", "script"],
    FORBID_ATTR: ["style", "onclick"],
  });

  return <div className={`${styles.contentRenderer} ${className}`} dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
};
