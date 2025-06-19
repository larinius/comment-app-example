import { Tab } from "@headlessui/react";
import { useRef } from "react";
import { z } from "zod";
import { useNotifications } from "../context/NotificationContext";
import { ViewContent } from "./CommentContent";

const ALLOWED_TAGS = ["a", "code", "i", "strong"];
const ALLOWED_ATTRS = ["href", "title"];

const commentSchema = z
  .string()
  .min(1, "Comment cannot be empty")
  .max(5000, "Comment is too long")
  .refine((val) => {
    const doc = new DOMParser().parseFromString(val, "text/html");
    const invalidElements = Array.from(doc.body.querySelectorAll("*")).filter((el) => !ALLOWED_TAGS.includes(el.tagName.toLowerCase()));
    return invalidElements.length === 0;
  }, "Contains invalid HTML tags");

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onValidate?: (isValid: boolean) => void;
  initialValue?: string;
}

export const RichTextEditor = ({ value, onChange, onValidate, initialValue = "" }: RichTextEditorProps) => {
  const { addToast } = useNotifications();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const validateContent = (content: string) => {
    const validation = commentSchema.safeParse(content);
    const isValid = validation.success;

    if (onValidate) {
      onValidate(isValid);
    }

    if (!isValid && validation.error) {
      addToast(validation.error.errors[0].message, "error");
    }

    return isValid;
  };

  const handleInsertTag = (tag: string) => {
    if (!textareaRef.current) return;

    const { selectionStart, selectionEnd } = textareaRef.current;
    const selectedText = value.substring(selectionStart, selectionEnd);
    let newValue = value;

    if (tag === "a") {
      newValue = value.substring(0, selectionStart) + `<a href="" title="">${selectedText}</a>` + value.substring(selectionEnd);
    } else {
      newValue = value.substring(0, selectionStart) + `<${tag}>${selectedText}</${tag}>` + value.substring(selectionEnd);
    }

    onChange(newValue);
    validateContent(newValue);

    setTimeout(() => {
      if (textareaRef.current) {
        const cursorPos =
          tag === "a"
            ? selectionStart + `<a href="" title="">`.length + selectedText.length
            : selectionStart + `<${tag}>`.length + selectedText.length;
        textareaRef.current.setSelectionRange(cursorPos, cursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleChange = (newValue: string) => {
    onChange(newValue);
    validateContent(newValue);
  };

  const renderPreview = () => {
    return <ViewContent content={value} className="p-3 border rounded-md min-h-[150px]  border-gray-200" />;
  };

  return (
    <div className="space-y-4">
      <Tab.Group>
        <Tab.List className="flex gap-2 rounded-md p-1">
          <Tab className="bg-gray-100 hover:bg-gray-200 cursor-pointer w-full py-2 px-2 text-sm font-medium rounded-md ui-selected:bg-white ui-selected:shadow focus:outline-none">
            Write
          </Tab>
          <Tab className="bg-gray-100 hover:bg-gray-200 cursor-pointer w-full py-2 px-2 text-sm font-medium rounded-md ui-selected:bg-white ui-selected:shadow focus:outline-none">
            Preview
          </Tab>
        </Tab.List>
        <Tab.Panels className="mt-2">
          <Tab.Panel className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {ALLOWED_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleInsertTag(tag)}
                  className="cursor-pointer px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  {`<${tag}>`}
                </button>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full min-h-[150px] p-3 border rounded-md  border-gray-200"
              placeholder="Write your comment..."
            />
          </Tab.Panel>
          <Tab.Panel>
            <div className="h-[36px]"></div>
            {renderPreview()}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};
