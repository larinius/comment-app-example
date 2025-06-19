import { useState } from "react";
import { useQuery, useSubscription, useMutation } from "@apollo/client";
import { GET_UNREAD_NOTIFICATIONS, NOTIFICATION_SUBSCRIPTION, MARK_AS_READ } from "../graphql/notifications";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { motion, AnimatePresence } from "framer-motion";
import { useCommentSubmission } from "../hooks/useCommentSubmission";
import { playNotificationSound } from "../utils/sounds";

interface Notification {
  id: string;
  message: string;
  commentId: string;
  read: boolean;
  createdAt: string;
  userId: string;
}

export const NotificationBell = () => {
  const { isLoggedIn } = useAuth();
  const { addToast } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const { refetchAll } = useCommentSubmission();

  const {
    data,
    loading,
    error,
    refetch: refetchNotifications,
  } = useQuery(GET_UNREAD_NOTIFICATIONS, {
    skip: !isLoggedIn,
    fetchPolicy: "cache-and-network",
  });

  const [markAsRead] = useMutation(MARK_AS_READ);

  useSubscription(NOTIFICATION_SUBSCRIPTION, {
    skip: !isLoggedIn,
    onData: ({ data }) => {
      if (data.data?.notificationAdded) {
        const notification = data.data.notificationAdded;

        addToast(notification.message, "info");
        refetchAll(notification.commentId);
        refetchNotifications();
        playNotificationSound();
      }
    },
    onError: (error) => {
      console.error("Subscription error:", error);
      addToast("Error receiving notifications", "error");
    },
  });

  const notifications = data?.unreadNotifications || [];
  const unreadCount = notifications.length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead({ variables: { id } });
      refetchNotifications();
    } catch (err) {
      addToast("Failed to mark notification as read", "error");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await Promise.all(notifications.map((notif: Notification) => markAsRead({ variables: { id: notif.id } })));
      refetchNotifications();
    } catch (err) {
      addToast("Failed to mark notifications as read", "error");
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="relative mx-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg overflow-hidden z-50"
          >
            <div className="flex justify-between items-center px-4 py-2 bg-gray-100 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllAsRead} className="text-xs text-indigo-600 hover:text-indigo-800">
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : error ? (
                <div className="p-4 text-center text-red-500">Error loading notifications</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No new notifications</div>
              ) : (
                <ul>
                  {notifications.map((notification: Notification) => (
                    <li key={notification.id} className="border-b border-gray-100 last:border-b-0">
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="block w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <p className="text-sm text-gray-800">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
