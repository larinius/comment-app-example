import { useState, useId } from "react";
import { RichTextEditor } from "./RichTextEditor";
import { Captcha } from "./Captcha";

interface SubmitFormProps {
  onSubmit: (
    text: string,
    options?: {
      file?: File;
      captchaToken?: string;
      captchaSolution?: string;
    },
  ) => Promise<void>;
  isSubmitting?: boolean;
  submitText?: string;
}

const SubmitForm = ({ onSubmit, isSubmitting = false, submitText = "Post comment" }: SubmitFormProps) => {
  const [content, setContent] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [fileName, setFileName] = useState<string | null>(null);
  const [captchaData, setCaptchaData] = useState<{
    token: string | null;
    solution: string | null;
  }>({ token: null, solution: null });
  const [resetCaptcha, setResetCaptcha] = useState(false);

  const fileInputId = useId();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const clearFile = () => {
    setSelectedFile(undefined);
    setFileName(null);
    const fileInput = document.getElementById(fileInputId) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleCaptchaVerified = (token: string, solution: string) => {
    setCaptchaData({ token, solution });
  };

  const handleSubmit = async () => {
    if (!isValid || !captchaData.token || !captchaData.solution) return;

    try {
      await onSubmit(content, {
        file: selectedFile,
        captchaToken: captchaData.token,
        captchaSolution: captchaData.solution,
      });

      setContent("");
      setSelectedFile(undefined);
      setFileName(null);
      setIsValid(false);
      setResetCaptcha((prev) => !prev);
    } catch (error) {
      console.error("Error submitting comment:", error);
      throw error;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
        Add your comment
      </label>

      <RichTextEditor value={content} onChange={setContent} onValidate={setIsValid} />

      <div className="mt-4">
        <Captcha
          onVerified={handleCaptchaVerified}
          onError={() => setIsValid(false)}
          onReset={() => setCaptchaData({ token: null, solution: null })}
          key={resetCaptcha ? "reset" : "initial"}
        />
      </div>

      <div className="flex justify-between mt-4">
        <div className="flex items-center gap-2">
          <input type="file" onChange={handleFileChange} className="hidden" id={fileInputId} accept="image/*,.pdf,.txt,.doc,.docx" />
          <label htmlFor={fileInputId} className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-800">
            {fileName ? "Change file" : "Add attachment (optional)"}
          </label>

          {fileName && (
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600 truncate max-w-xs">{fileName}</span>
              <button type="button" onClick={clearFile} className="text-red-500 hover:text-red-700" aria-label="Remove file">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !isValid || !captchaData.token}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Posting...
            </span>
          ) : (
            submitText
          )}
        </button>
      </div>
    </div>
  );
};

export default SubmitForm;
