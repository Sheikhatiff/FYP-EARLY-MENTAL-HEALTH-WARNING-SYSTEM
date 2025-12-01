import { create } from "zustand";
import axios from "axios";
import { io } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const NOTIFICATION_API_URL = `${API_BASE_URL}/api/v1/notifications`;
const SOCKET_URL = API_BASE_URL;
axios.defaults.withCredentials = true;

let socket = null;

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  criticalNotifications: [],
  isLoading: false,
  error: null,
  message: null,
  socket: null,

  /**
   * Initialize WebSocket connection
   */
  initSocket: (userId) => {
    if (socket) return socket;
    
    socket = io(SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected");
      socket.emit("user:join", userId);
    });

    socket.on("notification:new", (notification) => {
      console.log("[Socket] New notification:", notification);
      set((state) => ({
        notifications: [{ ...notification, isRealtime: true }, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));
    });

    socket.on("notification:read", ({ notificationId }) => {
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    });

    socket.on("notification:read-batch", ({ notificationIds, count }) => {
      set((state) => ({
        notifications: state.notifications.map((n) =>
          notificationIds.includes(n._id) ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - count),
      }));
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected");
    });

    set({ socket });
    return socket;
  },

  /**
   * Disconnect WebSocket
   */
  disconnectSocket: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      set({ socket: null });
    }
  },

  /**
   * Fetch all notifications with optional filtering
   * Query params: read, type, severity, limit, page
   */
  fetchNotifications: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = queryParams
        ? `${NOTIFICATION_API_URL}?${queryParams}`
        : NOTIFICATION_API_URL;

      const response = await axios.get(url);
      const newNotifications = response.data.data.notifications;
      
      set((state) => {
        // Merge fetched notifications with existing ones, avoiding duplicates
        // Create a map of notification IDs to avoid duplicates
        const notificationMap = new Map();
        
        // Add existing notifications first (they might have isRealtime flag)
        state.notifications.forEach(n => {
          notificationMap.set(n._id, n);
        });
        
        // Then add/update with fetched notifications
        newNotifications.forEach(n => {
          notificationMap.set(n._id, n);
        });
        
        // Convert back to array, maintaining order (most recent first)
        const mergedNotifications = Array.from(notificationMap.values())
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        return {
          notifications: mergedNotifications,
          isLoading: false,
        };
      });
      
      return response.data.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error fetching notifications",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Fetch unread notifications count
   */
  fetchUnreadCount: async () => {
    try {
      const response = await axios.get(`${NOTIFICATION_API_URL}/count/unread`);
      set({ unreadCount: response.data.data.unreadCount });
      return response.data.data.unreadCount;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      throw error;
    }
  },

  /**
   * Fetch critical notifications (for dashboard alerts)
   */
  fetchCriticalNotifications: async () => {
    try {
      const response = await axios.get(
        `${NOTIFICATION_API_URL}/critical/all`
      );
      set({ criticalNotifications: response.data.data.notifications });
      return response.data.data.notifications;
    } catch (error) {
      console.error("Error fetching critical notifications:", error);
      throw error;
    }
  },

  /**
   * Fetch single notification by ID
   */
  fetchNotificationById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${NOTIFICATION_API_URL}/${id}`);
      return response.data.data.notification;
    } catch (error) {
      set({
        error:
          error.response?.data?.message || "Error fetching notification",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.patch(
        `${NOTIFICATION_API_URL}/${id}/read`
      );

      // Update local state
      set((state) => ({
        notifications: state.notifications.map((notif) =>
          notif._id === id ? { ...notif, read: true, readAt: new Date() } : notif
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
        isLoading: false,
      }));

      return response.data.data.notification;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Error marking notification as read",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Mark multiple notifications as read
   */
  markMultipleAsRead: async (notificationIds) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${NOTIFICATION_API_URL}/read/batch`, {
        notificationIds,
      });

      // Update local state
      set((state) => ({
        notifications: state.notifications.map((notif) =>
          notificationIds.includes(notif._id)
            ? { ...notif, read: true, readAt: new Date() }
            : notif
        ),
        unreadCount: Math.max(0, state.unreadCount - notificationIds.length),
        isLoading: false,
      }));

      return response.data.data;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Error marking notifications as read",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Dismiss notification (but keep in history)
   */
  dismissNotification: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.patch(
        `${NOTIFICATION_API_URL}/${id}/dismiss`
      );

      // Update local state
      set((state) => ({
        notifications: state.notifications.map((notif) =>
          notif._id === id
            ? { ...notif, dismissed: true, dismissedAt: new Date() }
            : notif
        ),
        isLoading: false,
      }));

      return response.data.data.notification;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Error dismissing notification",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Delete notification permanently
   */
  deleteNotification: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`${NOTIFICATION_API_URL}/${id}`);

      // Update local state
      set((state) => ({
        notifications: state.notifications.filter((notif) => notif._id !== id),
        isLoading: false,
        message: "Notification deleted",
      }));
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Error deleting notification",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Clear all notifications
   */
  clearAllNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`${NOTIFICATION_API_URL}`);

      // Update local state
      set({
        notifications: [],
        criticalNotifications: [],
        unreadCount: 0,
        isLoading: false,
        message: "All notifications cleared",
      });
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Error clearing notifications",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Get unread notifications count without making API call
   */
  getUnreadCount: () => {
    return get().unreadCount;
  },

  /**
   * Filter notifications by type
   */
  getNotificationsByType: (type) => {
    return get().notifications.filter((notif) => notif.type === type);
  },

  /**
   * Filter notifications by severity
   */
  getNotificationsBySeverity: (severity) => {
    return get().notifications.filter((notif) => notif.severity === severity);
  },

  /**
   * Get unread notifications only
   */
  getUnreadNotifications: () => {
    return get().notifications.filter((notif) => !notif.read);
  },

  /**
   * Real-time notification polling
   * Call this periodically to check for new notifications
   */
  pollForNotifications: async () => {
    try {
      const unreadCount = await get().fetchUnreadCount();
      if (unreadCount > get().unreadCount) {
        // New notifications received, fetch them
        await get().fetchNotifications({ read: false });
      }
    } catch (error) {
      console.error("Error polling for notifications:", error);
    }
  },

  /**
   * Add notification to store (for real-time WebSocket updates)
   */
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Clear success message
   */
  clearMessage: () => {
    set({ message: null });
  },
}));
