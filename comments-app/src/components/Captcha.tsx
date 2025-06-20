import React, { useState, forwardRef, useImperativeHandle } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_CAPTCHA_CHALLENGE, VERIFY_CAPTCHA } from "../graphql/captcha";

interface CaptchaProps {
  onVerified: (token: string, solution: string) => void;
  onError?: () => void;
  onReset?: () => void;
}

export interface CaptchaRef {
  reset: () => void;
}

export const Captcha = forwardRef<CaptchaRef, CaptchaProps>(({ onVerified, onError }, ref) => {
  const [solution, setSolution] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [showError, setShowError] = useState(false);
  const [instanceId] = useState(() => Math.random().toString(36).substring(2, 9));
  
  const { data, loading, refetch } = useQuery(GET_CAPTCHA_CHALLENGE, {
    variables: { instanceId },
    fetchPolicy: "network-only",
    nextFetchPolicy: "network-only",
  });

  const [verifyCaptcha] = useMutation(VERIFY_CAPTCHA);

  const reset = () => {
    setIsVerified(false);
    setSolution("");
    setShowError(false);
    refetch();
  };

  useImperativeHandle(ref, () => ({ reset }));

  const handleVerify = async () => {
    try {
      if (!data?.getCaptchaChallenge?.token || !solution) {
        setShowError(true);
        return;
      }

      const { data: verificationData } = await verifyCaptcha({
        variables: {
          input: {
            token: data.getCaptchaChallenge.token,
            solution,
          },
        },
      });

      if (verificationData?.verifyCaptcha?.isValid) {
        setIsVerified(true);
        setShowError(false);
        onVerified(data.getCaptchaChallenge.token, solution);
      } else {
        setShowError(true);
        onError?.();
      }
    } catch (err) {
      setShowError(true);
      onError?.();
    }
  };

  if (isVerified) {
    return (
      <div className="flex items-center justify-center h-12 w-full bg-green-100 border border-green-300 rounded text-green-800">
        ✓ Verified
      </div>
    );
  }

  return (
    <div className="flex h-12 w-full rounded border border-gray-300 overflow-hidden">
      <div className="w-42 h-full flex items-center justify-center bg-white border-r border-gray-300">
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: data?.getCaptchaChallenge?.image || "" }}
          />
        )}
      </div>

      <input
        type="text"
        value={solution}
        onChange={(e) => {
          setSolution(e.target.value);
          setShowError(false);
        }}
        className={`flex-1 px-4 border-none focus:ring-0 bg-white ${showError ? "text-red-500 placeholder-red-500" : "text-gray-800"}`}
        placeholder={showError ? "Wrong answer!" : "Enter CAPTCHA"}
      />

      <button
        onClick={reset}
        className="w-12 h-full flex items-center justify-center bg-white hover:bg-gray-100 border-l border-gray-300 text-gray-700"
      >
        ↻
      </button>

      <button
        onClick={handleVerify}
        disabled={!solution}
        className={`w-12 h-full flex items-center justify-center text-white disabled:opacity-50 ${
          showError ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"
        }`}
      >
        {showError ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          "✓"
        )}
      </button>
    </div>
  );
});
