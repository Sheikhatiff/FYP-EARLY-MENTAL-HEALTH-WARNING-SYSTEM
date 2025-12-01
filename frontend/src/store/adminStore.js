import { create } from "zustand";
import axios from "axios";
import { io } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const USER_API_URL = `${API_BASE_URL}/api/v1/users`;
const SOCKET_URL = API_BASE_URL;
axios.defaults.withCredentials = true;

let socket = null;

export const useAdminStore = create((set, get) => ({
  users: [],
  selectedUser: null,
  onlineUserIds: [],
  error: null,
  isLoading: false,
  message: null,

  getAllUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get(USER_API_URL);
      const users = res.data.data.users;
      
      // Fetch online status and add to users
      const onlineRes = await axios.get(`${USER_API_URL}/status/online`);
      const onlineUserIds = onlineRes.data.data.onlineUserIds;
      
      const usersWithStatus = users.map((user) => ({
        ...user,
        isOnline: onlineUserIds.includes(user._id),
      }));
      
      set({ 
        users: usersWithStatus, 
        onlineUserIds,
        isLoading: false 
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Error fetching users",
        isLoading: false,
      });
      throw err;
    }
  },

  /**
   * Initialize Socket.io for real-time online status updates
   */
  initSocket: () => {
    if (socket) return;
    
    socket = io(SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("[Admin Socket] Connected");
    });

    // Listen for user online events
    socket.on("user:online", ({ userId }) => {
      set((state) => {
        // Update user online status
        const updatedUsers = state.users.map((user) =>
          user._id === userId ? { ...user, isOnline: true } : user
        );
        // Add to onlineUserIds if not already there
        const updatedOnlineIds = state.onlineUserIds.includes(userId)
          ? state.onlineUserIds
          : [...state.onlineUserIds, userId];
        
        return {
          users: updatedUsers,
          onlineUserIds: updatedOnlineIds,
        };
      });
    });

    // Listen for user offline events
    socket.on("user:offline", ({ userId }) => {
      set((state) => {
        // Update user online status
        const updatedUsers = state.users.map((user) =>
          user._id === userId ? { ...user, isOnline: false } : user
        );
        // Remove from onlineUserIds
        const updatedOnlineIds = state.onlineUserIds.filter(
          (id) => id !== userId
        );
        
        return {
          users: updatedUsers,
          onlineUserIds: updatedOnlineIds,
        };
      });
    });

    socket.on("disconnect", () => {
      console.log("[Admin Socket] Disconnected");
    });
  },

  /**
   * Disconnect Socket.io
   */
  disconnectSocket: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getUserById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get(`${USER_API_URL}/${id}`);
      set({ selectedUser: res.data.data.user, isLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Error fetching user",
        isLoading: false,
      });
      throw err;
    }
  },

  createUser: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post(USER_API_URL, userData);
      set((state) => ({
        users: [...state.users, res.data.data.user],
        message: "User created successfully",
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err.response?.data?.message || "Error creating user",
        isLoading: false,
      });
      throw err;
    }
  },

  updateUser: async (id, updatedData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.patch(`${USER_API_URL}/${id}`, updatedData);
      set((state) => ({
        users: state.users.map((u) => (u._id === id ? res.data.data.user : u)),
        selectedUser: res.data.data.user,
        message: "User updated successfully",
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err.response?.data?.message || "Error updating user",
        isLoading: false,
      });
      throw err;
    }
  },

  deleteUser: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`${USER_API_URL}/${id}`);
      set((state) => ({
        users: state.users.filter((u) => u._id !== id),
        message: "User deleted successfully",
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err.response?.data?.message || "Error deleting user",
        isLoading: false,
      });
      throw err;
    }
  },

  adminUpdateUser: async (id, updatedData) => {
    set({ isLoading: true, error: null, message: null });
    try {
      // Clean the data - remove empty password fields completely
      const cleanedData = { ...updatedData };

      // If both password fields are empty, remove them entirely from the request
      if (
        (!cleanedData.password || cleanedData.password.trim() === "") &&
        (!cleanedData.passwordConfirm ||
          cleanedData.passwordConfirm.trim() === "")
      ) {
        delete cleanedData.password;
        delete cleanedData.passwordConfirm;
      }

      // Also remove empty email if it exists
      if (!cleanedData.email || cleanedData.email.trim() === "") {
        delete cleanedData.email;
      }

      const res = await axios.patch(`${USER_API_URL}/admin/${id}`, cleanedData);
      const updatedUser = res.data?.data;

      set((state) => ({
        users: state.users.map((u) => (u._id === id ? updatedUser : u)),
        selectedUser: updatedUser,
        message: res.data?.message || "User updated successfully by admin",
        isLoading: false,
      }));

      return updatedUser;
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Error updating user";
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  sendBroadcastNotification: async (title, description, severity = "info") => {
    set({ isLoading: true, error: null, message: null });
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/notifications/broadcast/send`,
        {
          title,
          description,
          severity,
        }
      );
      set((state) => ({
        message: res.data.data.message || "Notification sent successfully",
        isLoading: false,
      }));
      return res.data.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Error sending notification";
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },
}));
