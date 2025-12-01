import React, { useEffect } from "react";
import { AlertCircle, CheckCircle, Info, Zap, Smile } from "lucide-react";
import toast from "react-hot-toast";
import { useNotificationStore } from "../store/notificationStore";

const NotificationToastDisplay = () => {
  const { notifications } = useNotificationStore();
  const shownNotifications = React.useRef(new Set());

  // Show ONLY real-time notifications as toasts
  useEffect(() => {
    // Only show notifications that came from real-time socket events
    const realtimeNotifications = notifications.filter(
      (n) => n.isRealtime && !n.read
    );

    realtimeNotifications.forEach((notification) => {
      // Only show if we haven't shown this notification yet
      if (!shownNotifications.current.has(notification._id)) {
        shownNotifications.current.add(notification._id);
        showNotificationToast(notification);
      }
    });
  }, [notifications]);

  const getIcon = (type) => {
    switch (type) {
      case "DEVIATION_ALERT":
      case "RISK_ALERT":
        return AlertCircle;
      case "SPIKE_WARNING":
      case "PATTERN_WARNING":
        return Zap;
      case "POSITIVE_MILESTONE":
        return Smile;
      case "BASELINE_UPDATE":
        return CheckCircle;
      default:
        return Info;
    }
  };

  const getToastConfig = (severity) => {
    switch (severity) {
      case "critical":
        return {
          bg: "bg-red-500",
          borderLeft: "border-l-4 border-l-red-700",
          icon: "text-white",
          duration: 6000,
        };
      case "high":
        return {
          bg: "bg-orange-500",
          borderLeft: "border-l-4 border-l-orange-700",
          icon: "text-white",
          duration: 5000,
        };
      case "medium":
        return {
          bg: "bg-yellow-500",
          borderLeft: "border-l-4 border-l-yellow-700",
          icon: "text-white",
          duration: 4000,
        };
      default:
        return {
          bg: "bg-emerald-500",
          borderLeft: "border-l-4 border-l-emerald-700",
          icon: "text-white",
          duration: 3500,
        };
    }
  };

  const showNotificationToast = (notification) => {
    const { severity, type, title, message } = notification;
    const config = getToastConfig(severity);
    const Icon = getIcon(type);

    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-in slide-in-from-right-5 fade-in" : "animate-out slide-out-to-right-5 fade-out"
          } ${config.bg} ${config.borderLeft} text-white rounded-lg shadow-2xl overflow-hidden max-w-sm pointer-events-auto duration-300 backdrop-blur-sm`}
        >
          <div className="p-4 flex items-start gap-3">
            {/* Icon */}
            <div className={`flex-shrink-0 mt-0.5 ${config.icon}`}>
              <Icon className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight text-white">
                {title}
              </p>
              <p className="text-sm opacity-90 line-clamp-2 mt-1 text-white">
                {message}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Close notification"
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      ),
      {
        duration: config.duration,
        position: "top-right",
        id: `notification-${notification._id}`,
      }
    );
  };

  // This component only manages toast display, no JSX render needed
  return null;
};

export default NotificationToastDisplay;
