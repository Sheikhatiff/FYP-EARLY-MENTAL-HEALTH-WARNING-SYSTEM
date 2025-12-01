import { create } from "zustand";
import axios from "axios";
import { io } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_URL = `${API_BASE_URL}/api/v1`;

// Socket instance
let socket = null;

export const useSupportChatStore = create((set, get) => ({
  messages: [],
  onlineUsers: [],
  isLoading: false,
  isConnected: false,
  typingUsers: new Set(),

  // Initialize socket connection
  initSocket: (userId) => {
    if (socket?.connected) return;

    socket = io(API_BASE_URL, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("[Support Chat] Connected to socket");
      set({ isConnected: true });
      socket.emit("user:join", userId);
    });

    socket.on("disconnect", () => {
      console.log("[Support Chat] Disconnected from socket");
      set({ isConnected: false });
    });

    // Listen for new messages
    socket.on("support:message", (message) => {
      set((state) => ({
        messages: [...state.messages, message],
      }));
    });

    // Listen for message deletions
    socket.on("support:message:deleted", ({ messageId }) => {
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== messageId),
      }));
    });

    // Listen for user online status
    socket.on("user:online", ({ userId }) => {
      set((state) => {
        const exists = state.onlineUsers.find((u) => u._id === userId);
        if (!exists) {
          get().fetchOnlineUsers(); // Refresh online users
        }
        return state;
      });
    });

    socket.on("user:offline", ({ userId }) => {
      set((state) => ({
        onlineUsers: state.onlineUsers.filter((u) => u._id !== userId),
      }));
    });

    // Typing indicators
    socket.on("support:user:typing", ({ userId, userName }) => {
      set((state) => {
        const newTyping = new Set(state.typingUsers);
        newTyping.add(`${userId}:${userName}`);
        return { typingUsers: newTyping };
      });
    });

    socket.on("support:user:stop-typing", ({ userId }) => {
      set((state) => {
        const newTyping = new Set(state.typingUsers);
        const entries = Array.from(newTyping);
        entries.forEach((entry) => {
          if (entry.startsWith(`${userId}:`)) {
            newTyping.delete(entry);
          }
        });
        return { typingUsers: newTyping };
      });
    });
  },

  // Disconnect socket
  disconnectSocket: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      set({ isConnected: false });
    }
  },

  // Fetch messages
  fetchMessages: async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/support-chat/messages`, {
        withCredentials: true,
      });
      set({ messages: response.data.data.messages, isLoading: false });
    } catch (error) {
      console.error("Error fetching messages:", error);
      set({ isLoading: false });
    }
  },

  // Send message
  sendMessage: async (message) => {
    try {
      const response = await axios.post(
        `${API_URL}/support-chat/messages`,
        { message },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  // Delete message
  deleteMessage: async (messageId) => {
    try {
      await axios.delete(`${API_URL}/support-chat/messages/${messageId}`, {
        withCredentials: true,
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  },

  // Fetch online users
  fetchOnlineUsers: async () => {
    try {
      const response = await axios.get(`${API_URL}/support-chat/online-users`, {
        withCredentials: true,
      });
      set({ onlineUsers: response.data.data });
    } catch (error) {
      console.error("Error fetching online users:", error);
    }
  },

  // Emit typing event
  emitTyping: (userId, userName) => {
    if (socket?.connected) {
      socket.emit("support:typing", { userId, userName });
    }
  },

  // Emit stop typing event
  emitStopTyping: (userId) => {
    if (socket?.connected) {
      socket.emit("support:stop-typing", { userId });
    }
  },
}));
