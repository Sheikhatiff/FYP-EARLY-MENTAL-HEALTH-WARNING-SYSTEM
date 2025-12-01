import React from "react";
import { X, Bell, AlertTriangle, TrendingUp, CheckCircle, Info } from "lucide-react";
import toast from "react-hot-toast";

const NotificationItem = ({
  notification,
  onMarkAsRead,
  onDelete,
  compact = false,
}) => {
  const {
    _id,
    type,
    severity,
    title,
    message,
    description,
    read,
    createdAt,
    triggerData,
  } = notification;

  // Get severity color
  const getSeverityColor = () => {
    switch (severity) {
      case "critical":
        return "border-red-500 bg-red-50 dark:bg-red-900/20";
      case "high":
        return "border-orange-500 bg-orange-50 dark:bg-orange-900/20";
      case "medium":
        return "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      case "low":
      case "info":
      default:
        return "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20";
    }
  };

  // Get severity text color
  const getSeverityTextColor = () => {
    switch (severity) {
      case "critical":
        return "text-red-700 dark:text-red-200";
      case "high":
        return "text-orange-700 dark:text-orange-200";
      case "medium":
        return "text-yellow-700 dark:text-yellow-200";
      case "low":
      case "info":
      default:
        return "text-emerald-700 dark:text-emerald-200";
    }
  };

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case "DEVIATION_ALERT":
        return <AlertTriangle className="w-5 h-5" />;
      case "SPIKE_WARNING":
        return <TrendingUp className="w-5 h-5" />;
      case "POSITIVE_MILESTONE":
        return <CheckCircle className="w-5 h-5" />;
      case "RISK_ALERT":
        return <AlertTriangle className="w-5 h-5" />;
      case "PATTERN_WARNING":
        return <Info className="w-5 h-5" />;
      case "BASELINE_UPDATE":
      case "INFO":
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const handleMarkAsRead = async () => {
    try {
      await onMarkAsRead(_id);
      toast.success("Marked as read", {
        position: "top-right",
        duration: 1500,
        icon: "✓",
      });
    } catch {
      toast.error("Failed to mark as read", {
        position: "top-right",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(_id);
      toast.success("Notification deleted", {
        position: "top-right",
        duration: 2000,
        icon: "🗑️",
      });
    } catch {
      toast.error("Failed to delete notification", {
        position: "top-right",
      });
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  if (compact) {
    // Compact card view for notification center
    return (
      <div
        className={`border-l-4 p-4 rounded-r-lg transition-all duration-200 ${getSeverityColor()} ${
          !read ? "bg-opacity-100" : "bg-opacity-50"
        } hover:shadow-md group`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`flex-shrink-0 mt-1 ${getSeverityTextColor()}`}>
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                {title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {message}
              </p>
              {description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                  {description}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {formatTime(createdAt)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {!read && (
              <button
                onClick={handleMarkAsRead}
                className="p-1.5 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                title="Mark as read"
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-1.5 hover:bg-red-400 dark:hover:bg-red-600 rounded transition-colors"
              title="Delete notification"
            >
              <X className="w-4 h-4 text-gray-500 hover:text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full view for notification detail/list
  return (
    <div
      className={`border rounded-lg p-4 transition-all duration-200 ${getSeverityColor()} ${
        !read ? "shadow-md" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`flex-shrink-0 mt-1 ${getSeverityTextColor()}`}>
            {getIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                {title}
              </h3>
              {severity === "critical" && (
                <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-semibold rounded-full">
                  CRITICAL
                </span>
              )}
              {severity === "high" && (
                <span className="px-2 py-0.5 bg-orange-600 text-white text-xs font-semibold rounded-full">
                  HIGH
                </span>
              )}
              {!read && (
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              )}
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
              {message}
            </p>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 p-2 bg-black/10 dark:bg-white/10 rounded">
                {description}
              </p>
            )}

            {/* Trigger data info */}
            {triggerData && Object.keys(triggerData).length > 0 && (
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mt-2 p-2 bg-black/5 dark:bg-white/5 rounded">
                {triggerData.emotionType && (
                  <p>
                    <strong>Emotion:</strong> {triggerData.emotionType}
                  </p>
                )}
                {triggerData.deviationScore && (
                  <p>
                    <strong>Deviation:</strong>{" "}
                    {(triggerData.deviationScore * 100).toFixed(1)}%
                  </p>
                )}
                {triggerData.percentageChange && (
                  <p>
                    <strong>Change:</strong> {triggerData.percentageChange}%
                  </p>
                )}
                {triggerData.alertReason && (
                  <p>
                    <strong>Reason:</strong> {triggerData.alertReason}
                  </p>
                )}
              </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              {formatTime(createdAt)}
            </p>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleDelete}
          className="p-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors flex-shrink-0"
          title="Delete"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
        {!read && (
          <button
            onClick={handleMarkAsRead}
            className="px-3 py-1.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded transition-colors font-medium"
          >
            Mark as Read
          </button>
        )}
        <button
          onClick={handleDelete}
          className="px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded transition-colors font-medium ml-auto"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default NotificationItem;
