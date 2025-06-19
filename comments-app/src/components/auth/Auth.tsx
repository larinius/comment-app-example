import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import LoginPopup from "./LoginModal";

export const Auth = () => {
  const { user, isLoggedIn, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <>
      {isLoggedIn ? (
        <div className="flex items-center space-x-4">
          {user?.avatar?.signedUrl ? (
            <img src={user.avatar.signedUrl} alt={`${user.username || user.email}'s avatar`} className="h-8 w-8 rounded-full" />
          ) : (
            <div className="flex-shrink-0 bg-indigo-100 text-indigo-800 rounded-full w-8 h-8 flex items-center justify-center font-medium">
              {user?.username?.charAt(0) || user?.email?.charAt(0) || "U"}
            </div>
          )}
          <span className="text-sm text-gray-700">{user?.username || user?.email}</span>
          <button
            onClick={logout}
            className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Logout
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => setLoginOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Sign in
          </button>

          {loginOpen && <LoginPopup onClose={() => setLoginOpen(false)} onLoginSuccess={() => setLoginOpen(false)} />}
        </>
      )}
    </>
  );
};
