import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useNotificationStore } from "../store/notificationStore";
import { useAuthStore } from "../store/authStore";

const NotificationBell = ({ onClick }) => {
  const { unreadCount, fetchUnreadCount, initSocket, disconnectSocket } = useNotificationStore();
  const { user } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize WebSocket and unread count on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize unread count
        await fetchUnreadCount();

        // Initialize WebSocket connection if user is logged in
        if (user?._id) {
          initSocket(user._id);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize notifications:", error);
        setIsInitialized(true);
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, [user?._id, fetchUnreadCount, initSocket, disconnectSocket]);

  if (!isInitialized) {
    return (
      <button className="p-3 hover:bg-green-500/20 rounded-full transition-all duration-300 relative">
        <Bell className="w-7 h-7 text-green-400" />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="relative p-3 hover:bg-green-500/20 rounded-full transition-all duration-300 group"
      aria-label="Notifications"
    >
      <Bell className="w-7 h-7 text-green-400 group-hover:text-green-300 transition-colors duration-200" />

      {/* Unread badge - More visible */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[24px] h-6 px-2 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-500/50 border-2 border-red-700">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}

      {/* Glow effect when unread notifications exist */}
      {unreadCount > 0 && (
        <div className="absolute inset-0 rounded-full bg-red-500 opacity-10 animate-ping"></div>
      )}
    </button>
  );
};

export default NotificationBell;
