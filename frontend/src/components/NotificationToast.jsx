import React from "react";
import { AlertTriangle, TrendingUp, CheckCircle, Info, X } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Toast notification component for real-time alerts
 * Maps notification types to toast displays
 */
export const showNotificationToast = (notification) => {
  const { type, severity, title, message, action } = notification;

  let Icon;
  let bgColor;
  let borderColor;

  switch (type) {
    case "RISK_ALERT":
    case "DEVIATION_ALERT":
      Icon = AlertTriangle;
      bgColor = "bg-red-500";
      borderColor = "border-red-600";
      break;
    case "SPIKE_WARNING":
    case "PATTERN_WARNING":
      Icon = TrendingUp;
      bgColor = "bg-orange-500";
      borderColor = "border-orange-600";
      break;
    case "POSITIVE_MILESTONE":
      Icon = CheckCircle;
      bgColor = "bg-emerald-500";
      borderColor = "border-emerald-600";
      break;
    default:
      Icon = Info;
      bgColor = "bg-blue-500";
      borderColor = "border-blue-600";
  }

  // Determine duration based on severity
  let duration = 4000;
  if (severity === "critical") duration = 6000;
  if (severity === "low" || severity === "info") duration = 3000;

  // Show the toast
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } w-full max-w-md ${bgColor} border-l-4 ${borderColor} text-white rounded-lg shadow-lg overflow-hidden`}
      >
        <div className="p-4 flex items-start gap-3">
          <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-sm opacity-90 line-clamp-2">{message}</p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action button */}
        {action && action.type !== "NONE" && (
          <div className="px-4 pb-3 pt-1">
            <button className="w-full px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors">
              {action.label || "Take Action"}
            </button>
          </div>
        )}
      </div>
    ),
    {
      duration,
      position: "top-right",
    }
  );
};

/**
 * Hook for showing notification toasts
 * Use this in components that receive real-time notifications
 */
export const useNotificationToast = () => {
  return {
    showToast: showNotificationToast,
    showSuccess: (title, message) => {
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } w-full max-w-md bg-emerald-500 border-l-4 border-emerald-600 text-white rounded-lg shadow-lg overflow-hidden p-4 flex items-start gap-3`}
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">{title}</h4>
              <p className="text-sm opacity-90">{message}</p>
            </div>
          </div>
        ),
        { duration: 3000, position: "top-right" }
      );
    },
    showError: (title, message) => {
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } w-full max-w-md bg-red-500 border-l-4 border-red-600 text-white rounded-lg shadow-lg overflow-hidden p-4 flex items-start gap-3`}
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">{title}</h4>
              <p className="text-sm opacity-90">{message}</p>
            </div>
          </div>
        ),
        { duration: 4000, position: "top-right" }
      );
    },
    showWarning: (title, message) => {
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } w-full max-w-md bg-orange-500 border-l-4 border-orange-600 text-white rounded-lg shadow-lg overflow-hidden p-4 flex items-start gap-3`}
          >
            <TrendingUp className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">{title}</h4>
              <p className="text-sm opacity-90">{message}</p>
            </div>
          </div>
        ),
        { duration: 4000, position: "top-right" }
      );
    },
  };
};
