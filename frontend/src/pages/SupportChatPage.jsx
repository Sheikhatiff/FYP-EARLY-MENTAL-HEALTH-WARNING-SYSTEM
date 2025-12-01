import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Send,
  Users,
  Heart,
  Sparkles,
  Shield,
  ArrowLeft,
  Trash2,
  Circle,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useSupportChatStore } from "../store/supportChatStore";
import toast from "react-hot-toast";

const SupportChatPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    messages,
    onlineUsers,
    isLoading,
    isConnected,
    typingUsers,
    initSocket,
    disconnectSocket,
    fetchMessages,
    sendMessage,
    deleteMessage,
    fetchOnlineUsers,
    emitTyping,
    emitStopTyping,
  } = useSupportChatStore();

  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (user?._id) {
      initSocket(user._id);
      fetchMessages();
      fetchOnlineUsers();
    }

    return () => {
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      emitTyping(user._id, user.name);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      emitStopTyping(user._id);
    }, 1500);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const messageToSend = messageInput.trim();
    setMessageInput("");
    setIsTyping(false);
    emitStopTyping(user._id);

    try {
      await sendMessage(messageToSend);
    } catch {
      toast.error("Failed to send message");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
      toast.success("Message deleted");
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypingUsersText = () => {
    const typingArray = Array.from(typingUsers)
      .map((entry) => entry.split(":")[1])
      .filter((name) => name !== user.name);

    if (typingArray.length === 0) return null;
    if (typingArray.length === 1) return `${typingArray[0]} is typing...`;
    if (typingArray.length === 2)
      return `${typingArray[0]} and ${typingArray[1]} are typing...`;
    return `${typingArray.length} people are typing...`;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-emerald-900/20 to-gray-900">
      {/* Sidebar - Online Users */}
      <aside className="w-80 bg-gray-800/95 backdrop-blur-sm border-r border-emerald-500/30 flex flex-col">
        <div className="p-6 border-b border-emerald-500/20">
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Community Support</h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Safe space for mental health support
          </p>
        </div>

        <div className="p-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-gray-300">
                Online Now
              </span>
            </div>
            <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full">
              {onlineUsers.length}
            </span>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
            {onlineUsers.map((onlineUser) => (
              <motion.div
                key={onlineUser._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center overflow-hidden">
                    {onlineUser.photo && onlineUser.photo !== "default.jpg" ? (
                      <img
                        src={`http://localhost:5000/img/users/${onlineUser?.photo}`}
                        alt={onlineUser.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `<span class="text-sm font-bold text-white">${onlineUser.name?.charAt(0).toUpperCase()}</span>`;
                        }}
                      />
                    ) : (
                      <span className="text-sm font-bold text-white">
                        {onlineUser.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">
                      {onlineUser.name}
                    </p>
                    {onlineUser.role === "admin" && (
                      <Shield className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    )}
                  </div>
                  {onlineUser._id === user._id && (
                    <p className="text-xs text-emerald-400">You</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-gray-800/50">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Circle
              className={`w-2 h-2 ${
                isConnected ? "text-green-500 fill-green-500" : "text-red-500"
              }`}
            />
            <span>{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <header className="h-20 bg-gray-800/50 backdrop-blur-sm border-b border-emerald-500/20 flex items-center justify-between px-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-emerald-400" />
              Mental Health Support Chat
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Share your thoughts • You're not alone • Support each other
            </p>
          </div>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-900/50">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Heart className="w-12 h-12 text-emerald-400" />
              </motion.div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Heart className="w-16 h-16 text-emerald-400/30 mb-4" />
              <p className="text-gray-400 text-lg">No messages yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Start the conversation and share your thoughts
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg, index) => {
                const isOwnMessage = msg.userId === user._id;
                const isAdmin = msg.userRole === "admin";
                const showAvatar =
                  index === 0 || messages[index - 1].userId !== msg.userId;
                
                // Get current user photo from onlineUsers if available, otherwise use stored photo
                const currentUser = onlineUsers.find(u => u._id === msg.userId);
                const userPhoto = currentUser?.photo || msg.userPhoto;

                return (
                  <motion.div
                    key={msg._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`flex gap-3 ${
                      isOwnMessage ? "flex-row-reverse" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {showAvatar ? (
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${
                            isAdmin
                              ? "bg-gradient-to-br from-amber-400 to-orange-500"
                              : "bg-gradient-to-br from-emerald-400 to-emerald-600"
                          }`}
                        >
                          {userPhoto && userPhoto !== "default.jpg" ? (
                            <img
                              src={`http://localhost:5000/img/users/${userPhoto}`}
                              alt={msg.userName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `<span class="text-sm font-bold text-white">${msg.userName?.charAt(0).toUpperCase()}</span>`;
                              }}
                            />
                          ) : (
                            <span className="text-sm font-bold text-white">
                              {msg.userName?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="w-10"></div>
                      )}
                    </div>

                    {/* Message Content */}
                    <div
                      className={`flex-1 max-w-2xl ${
                        isOwnMessage ? "items-end" : "items-start"
                      } flex flex-col`}
                    >
                      {showAvatar && (
                        <div
                          className={`flex items-center gap-2 mb-1 ${
                            isOwnMessage ? "flex-row-reverse" : ""
                          }`}
                        >
                          <span
                            className={`text-sm font-semibold ${
                              isAdmin ? "text-amber-400" : "text-emerald-400"
                            }`}
                          >
                            {isOwnMessage ? "You" : msg.userName}
                          </span>
                          {isAdmin && (
                            <div className="flex items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded-full">
                              <Shield className="w-3 h-3 text-amber-400" />
                              <span className="text-xs text-amber-400 font-semibold">
                                Admin
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div
                        className={`group relative ${
                          isOwnMessage ? "self-end" : "self-start"
                        }`}
                      >
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isOwnMessage
                              ? "bg-emerald-500/20 border border-emerald-500/30"
                              : isAdmin
                              ? "bg-amber-500/10 border border-amber-500/30"
                              : "bg-gray-700/50 border border-gray-600/30"
                          }`}
                        >
                          <p className="text-sm text-white break-words">
                            {msg.message}
                          </p>
                        </div>

                        <div
                          className={`flex items-center gap-2 mt-1 ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span className="text-xs text-gray-500">
                            {formatTime(msg.createdAt)}
                          </span>
                          {(isOwnMessage || user.role === "admin") && (
                            <button
                              onClick={() => handleDeleteMessage(msg._id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                            >
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}

          {/* Typing Indicator */}
          {getTypingUsersText() && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-xs text-gray-400"
            >
              <div className="flex gap-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="w-2 h-2 bg-emerald-400 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: 0.2,
                  }}
                  className="w-2 h-2 bg-emerald-400 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: 0.4,
                  }}
                  className="w-2 h-2 bg-emerald-400 rounded-full"
                />
              </div>
              <span>{getTypingUsersText()}</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-emerald-500/20 bg-gray-800/50 backdrop-blur-sm p-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                handleTyping();
              }}
              placeholder="Share your thoughts... (Press Enter to send)"
              className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
              maxLength={1000}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!messageInput.trim() || !isConnected}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all"
            >
              <Send className="w-5 h-5" />
              Send
            </motion.button>
          </form>
          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-xs text-gray-500">
              {messageInput.length}/1000 characters
            </p>
            <p className="text-xs text-gray-500">
              Be kind • Be supportive • Be respectful
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportChatPage;
