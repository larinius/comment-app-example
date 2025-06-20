import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";
type ToastType = "info" | "warning" | "error" | "success";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface NotificationContextType {
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType>(null!);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType, duration = 5000) => {

    const isDuplicate = toasts.some((toast) => toast.message === message && toast.type === type);

    if (isDuplicate) {
      return;
    }

    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type, duration };

    setToasts((prevToasts) => [...prevToasts, newToast]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 w-80">
        {toasts.map((toast) => (
          <ToastNotification key={toast.id} message={toast.message} type={toast.type} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

const ToastNotification = ({ message, type, onDismiss }: { message: string; type: ToastType; onDismiss: () => void }) => {
  const bgColor = {
    info: "bg-blue-100 border-blue-400 text-blue-700",
    warning: "bg-yellow-100 border-yellow-400 text-yellow-700",
    error: "bg-red-100 border-red-400 text-red-700",
    success: "bg-green-100 border-green-400 text-green-700",
  }[type];

  return (
    <div className={`${bgColor} border px-4 py-3 rounded relative shadow-lg transition-all duration-300 animate-fadeIn`} role="alert">
      <span className="block sm:inline">{message}</span>
      <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
        <button onClick={onDismiss} className="text-gray-500 hover:text-gray-700 focus:outline-none">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </span>
    </div>
  );
};
