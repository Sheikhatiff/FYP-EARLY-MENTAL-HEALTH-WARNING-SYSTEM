import React, { useState, useEffect } from "react";
import { X, Bell, Trash2, CheckCheck, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { useNotificationStore } from "../store/notificationStore";
import NotificationItem from "./NotificationItem";

const NotificationCenter = ({ onClose }) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markMultipleAsRead,
    dismissNotification,
    deleteNotification,
    clearAllNotifications,
  } = useNotificationStore();

  const [activeFilter, setActiveFilter] = useState("all");
  const [filteredNotifications, setFilteredNotifications] = useState([]);

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter notifications based on active filter
  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredNotifications(notifications);
    } else if (activeFilter === "unread") {
      setFilteredNotifications(notifications.filter((n) => !n.read));
    } else if (activeFilter === "critical") {
      setFilteredNotifications(
        notifications.filter((n) => n.severity === "critical")
      );
    } else if (activeFilter === "high") {
      setFilteredNotifications(
        notifications.filter((n) => n.severity === "high")
      );
    }
  }, [activeFilter, notifications]);

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications
      .filter((n) => !n.read)
      .map((n) => n._id);
    if (unreadIds.length > 0) {
      try {
        await markMultipleAsRead(unreadIds);
        toast.success(`Marked ${unreadIds.length} as read`, {
          position: "top-right",
          duration: 2000,
          icon: "✓",
        });
      } catch {
        toast.error("Failed to mark all as read", {
          position: "top-right",
        });
      }
    }
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to clear all notifications?")) {
      try {
        await clearAllNotifications();
        toast.success("All notifications cleared", {
          position: "top-right",
          duration: 2000,
          icon: "🗑️",
        });
      } catch {
        toast.error("Failed to clear notifications", {
          position: "top-right",
        });
      }
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-2xl overflow-hidden flex flex-col h-full border border-green-500/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-white" />
          <div>
            <h2 className="text-lg font-bold text-white">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-xs text-emerald-100">
                {unreadCount} unread
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-emerald-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-green-500/20 px-4 py-3 flex gap-1.5 overflow-x-auto scrollbar-hide flex-shrink-0 bg-gray-800/50">
        {[
          { id: "all", label: "All", icon: Bell },
          { id: "unread", label: "Unread", icon: Bell, badge: unreadCount },
          { id: "critical", label: "Critical" },
          { id: "high", label: "High" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3 py-2 rounded-md whitespace-nowrap font-medium text-xs transition-colors flex items-center gap-1.5 ${
              activeFilter === tab.id
                ? "bg-emerald-500 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {tab.label}
            {tab.badge ? (
              <span className="ml-0.5 px-2 py-0 bg-red-500 text-white text-xs rounded-full font-bold">
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-800/50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full py-12">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-emerald-300 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-gray-400">
                Loading...
              </p>
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <Bell className="w-12 h-12 text-gray-600 mb-3" />
            <p className="text-xs text-gray-400 text-center px-4">
              {activeFilter === "unread"
                ? "No unread notifications"
                : activeFilter === "critical"
                ? "No critical notifications"
                : activeFilter === "high"
                ? "No high priority notifications"
                : "No notifications yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDismiss={dismissNotification}
                onDelete={deleteNotification}
                compact
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {filteredNotifications.length > 0 && (
        <div className="border-t border-green-500/20 px-4 py-3 flex gap-2 justify-between bg-gray-800/80 flex-shrink-0">
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-xs"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark All
          </button>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;  