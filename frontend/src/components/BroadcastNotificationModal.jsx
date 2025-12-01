import React, { useState } from "react";
import { X, Send, AlertCircle, Loader } from "lucide-react";
import { useAdminStore } from "../store/adminStore.js";
import toast from "react-hot-toast";

const BroadcastNotificationModal = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("info");
  const { sendBroadcastNotification, isLoading } = useAdminStore();

  const handleSend = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a notification title");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a notification description");
      return;
    }

    try {
      await sendBroadcastNotification(title, description, severity);
      toast.success("Notification sent to all users!");
      setTitle("");
      setDescription("");
      setSeverity("info");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send notification");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-emerald-500/30 rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in scale-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border-b border-emerald-500/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Send className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              Send Broadcast Notification
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 hover:bg-gray-700/50 rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSend} className="p-6 space-y-4">
          {/* Info Banner */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-300">
              This notification will be sent to all users with role "user" in real-time.
            </p>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notification Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., System Update Available"
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-gray-700 border border-emerald-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
            />
            <p className="text-xs text-gray-400 mt-1">{title.length}/100 characters</p>
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notification Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter the notification message..."
              disabled={isLoading}
              rows={4}
              className="w-full px-4 py-2.5 bg-gray-700 border border-emerald-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 resize-none disabled:opacity-50"
            />
            <p className="text-xs text-gray-400 mt-1">
              {description.length}/500 characters
            </p>
          </div>

          {/* Severity Select */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Severity Level
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-gray-700 border border-emerald-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
            >
              <option value="info">Info</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 font-medium rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !title.trim() || !description.trim()}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Notification
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BroadcastNotificationModal;
