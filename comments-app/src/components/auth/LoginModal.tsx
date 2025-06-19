import React, { useState, useId } from "react";
import { useMutation } from "@apollo/client";
import { REGISTER_USER, LOGIN_USER } from "../../graphql/mutations";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

interface LoginPopupProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

const LoginPopup: React.FC<LoginPopupProps> = ({ onClose, onLoginSuccess }) => {
  const { addToast } = useNotifications();
  const { login } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarName, setAvatarName] = useState<string | null>(null);
  const fileInputId = useId();

  const [loginUser] = useMutation(LOGIN_USER, {
    onCompleted: (data) => {
      addToast("Login successful!", "success");
      login(data.login.token);
      onLoginSuccess();
      onClose();
    },
    onError: (err) => {
      addToast(err.message, "error");
      setError(err.message);
    },
  });

  const [registerUser] = useMutation(REGISTER_USER, {
    onCompleted: (data) => {
      addToast("Registration successful!", "success");
      login(data.createUser.token);
      onLoginSuccess();
      onClose();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setError("Only JPEG, PNG, GIF or WebP images are allowed");
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("Avatar must be less than 5MB");
        return;
      }

      setSelectedAvatar(file);
      setAvatarName(file.name);
      setError("");
    }
  };

  const clearAvatar = () => {
    setSelectedAvatar(null);
    setAvatarName(null);
    const fileInput = document.getElementById(fileInputId) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (isLogin) {
        await loginUser({
          variables: {
            input: { email, password },
          },
        });
      } else {
        const input = {
          email,
          username,
          password,
          ...(selectedAvatar && { avatar: selectedAvatar }),
        };

        await registerUser({
          variables: {
            input,
          },
          context: {
            headers: {
              "apollo-require-preflight": "true",
            },
          },
        });
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "An error occurred during registration");
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">{isLogin ? "Sign in" : "Create account"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  placeholder="Choose a username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor={fileInputId} className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Picture (optional)
                </label>
                <div className="flex items-center gap-2">
                  <input type="file" id={fileInputId} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                  <label
                    htmlFor={fileInputId}
                    className="cursor-pointer px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {avatarName ? "Change avatar" : "Select avatar"}
                  </label>
                  {avatarName && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-600 truncate max-w-[100px]">{avatarName}</span>
                      <button type="button" onClick={clearAvatar} className="text-red-500 hover:text-red-700" aria-label="Remove avatar">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">JPEG, PNG, GIF or WebP. Max 5MB.</p>
              </div>
            </>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder={isLogin ? "Enter your password" : "Create a password"}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-indigo-600 hover:text-indigo-800">
              {isLogin ? "Need an account? Register" : "Already have an account? Sign in"}
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isLogin ? "Sign in" : "Register"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPopup;
