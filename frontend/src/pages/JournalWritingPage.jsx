import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lightbulb, Loader, Mic, Pencil } from "lucide-react";
import { useJournalStore } from "../store/journalStore.js";
import { useAuthStore } from "../store/authStore.js";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Header from "../components/Header";

const JournalEntry = ({ isDashboard = true }) => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { createJournal, error, message, isLoading } = useJournalStore();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [showTip, setShowTip] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const recognitionRef = useRef(null);
  const maxCharacters = 1000;
  const maxTitleLength = 120;

  // Time updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleString("en-US", {
        weekday: "long",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      setCurrentTime(timeString.replace(/^\w+, /, "Today, "));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || "";
        if (result.isFinal) {
          finalText += transcript + " ";
        } else {
          interim += transcript + " ";
        }
      }

      if (finalText) {
        setContent((prev) => {
          const combined = (prev ? prev + " " : "") + finalText.trim();
          return combined.slice(0, maxCharacters);
        });
      }

      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      if (event.error !== "no-speech") {
        toast.error(`Speech recognition error: ${event.error}`);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore errors when stopping recognition
        }
      }
    };
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.warn("Error stopping recognition:", error);
      }
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        setInterimTranscript("");
      } catch (error) {
        console.warn("Error starting recognition:", error);
        toast.error("Failed to start speech recognition");
      }
    }
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value.slice(0, maxTitleLength));
  };

  const handleContentChange = (e) => {
    setContent(e.target.value.slice(0, maxCharacters));
  };

  const handlePublish = async () => {
    if (!content.trim()) {
      toast.error("Please write some content before publishing");
      return;
    }

    const savedTitle = title.trim() || "New Entry";
    
    try {
      await createJournal({ title: savedTitle, content });
      
      if (error) {
        toast.error(error);
        return;
      }

      // Reset form on success
      setTitle("");
      setContent("");
      setInterimTranscript("");
      toast.success(message || "Journal published successfully!");
      navigate("/home/all-journals-entries");
    } catch (error) {
      console.error("Publish error:", error);
      toast.error("Failed to publish journal");
    }
  };

  const handleClear = () => {
    if (content.trim() || title.trim()) {
      setConfirmOpen(true);
    }
  };

  const confirmClear = () => {
    setTitle("");
    setContent("");
    setInterimTranscript("");
    setConfirmOpen(false);
    toast.success("Entry cleared");
  };

  const cancelClear = () => {
    setConfirmOpen(false);
  };

  // Close modal with Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && confirmOpen) {
        cancelClear();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [confirmOpen]);

  const displayedValue = content + (interimTranscript ? " " + interimTranscript : "");
  const characterCount = Math.min(displayedValue.length, maxCharacters);

  return (
    <div className={`relative w-full flex flex-col ${isDashboard ? "h-full bg-gray-900" : "min-h-screen bg-gradient-to-br from-gray-900 to-gray-800"}`}>
      {!isDashboard && <Header logoSrc={"/LOGO-1.svg"} handleLogout={handleLogout} />}

      {/* Main container */}
      <div className={`flex-1 ${isDashboard ? "p-6 overflow-y-auto" : "p-4 pt-24 flex justify-center overflow-auto"}`}>
        <div className={`${isDashboard ? "w-full" : "w-full max-w-5xl"} bg-gradient-to-br from-gray-800/80 to-gray-700/60 backdrop-blur-sm border border-emerald-500/20 p-8 shadow-2xl flex flex-col rounded-2xl`}>
          {/* Header with editable title */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-6">
            <div className="flex-1 w-full">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-emerald-500/30 rounded-full text-gray-300 hover:text-white transition-all duration-200 mb-4"
                aria-label="Back to home"
              >
                <ArrowLeft size={16} />
                <span className="font-semibold text-sm">Back</span>
              </button>

              {/* Title input */}
              <div className="relative w-full lg:w-2/3 mb-2">
                <input
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="New Entry"
                  maxLength={maxTitleLength}
                  className="w-full text-2xl lg:text-3xl font-bold text-emerald-400 bg-gray-900/40 border border-emerald-600/30 rounded-xl px-4 py-3 pr-12 shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-emerald-400/60"
                  aria-label="Entry title"
                />
                <Pencil
                  size={20}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 opacity-70 pointer-events-none"
                />
              </div>

              <p className="text-gray-400 text-base lg:text-lg px-2.5">
                Express your thoughts in a safe space
              </p>

              {/* Writing Tip */}
              {showTip && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 bg-gray-800 border border-emerald-500/30 rounded-lg p-4 max-w-md shadow-lg relative"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={16} className="text-emerald-400" />
                    <span className="text-emerald-400 text-sm font-semibold">
                      Writing Tip
                    </span>
                    <button
                      onClick={() => setShowTip(false)}
                      className="ml-auto text-gray-500 hover:text-gray-300 text-lg font-bold transition-colors"
                      aria-label="Close tip"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Start with how you're feeling right now in this moment.
                  </p>
                </motion.div>
              )}
            </div>

            <div className="bg-gray-800 border border-emerald-500/20 rounded-lg px-4 py-2 shrink-0">
              <span className="text-emerald-500 text-sm font-medium">
                {currentTime}
              </span>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 mb-6 flex flex-col">
            <div className="flex-1 bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-emerald-500/30 rounded-2xl p-6 flex flex-col overflow-hidden relative min-h-[400px]">
              <textarea
                value={displayedValue}
                onChange={handleContentChange}
                placeholder="How are you feeling today? Share your thoughts..."
                className="w-full h-full min-h-[350px] bg-transparent text-gray-100 placeholder-gray-500 resize-none focus:outline-none text-lg leading-relaxed"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              />

              {/* Bottom controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4 pt-4 border-t border-gray-700">
                <button
                  onClick={toggleRecording}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all duration-200 ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-emerald-500/30"
                  }`}
                  aria-pressed={isRecording}
                >
                  <Mic size={18} />
                  {isRecording ? "Stop Recording" : "Start Recording"}
                </button>

                <span className={`text-sm ${
                  characterCount >= maxCharacters ? "text-red-400" : "text-gray-500"
                }`}>
                  {characterCount} / {maxCharacters} characters
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePublish}
              disabled={!content.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 rounded-xl text-white font-bold transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Publish"
              )}
            </motion.button>

            <button
              onClick={handleClear}
              disabled={!content.trim() && !title.trim()}
              className="px-5 py-3 border border-red-500/60 hover:border-red-500 rounded-xl text-red-500 hover:text-red-400 font-semibold transition-all duration-200 hover:bg-red-500/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-red-500/60 disabled:hover:text-red-500"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={cancelClear}
            aria-hidden="true"
          />

          {/* Modal panel */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-gradient-to-br from-gray-800/95 to-gray-700/95 border border-emerald-500/20 rounded-2xl p-6 max-w-md w-full mx-auto shadow-2xl z-10"
          >
            <h3 className="text-xl font-semibold text-emerald-400 mb-2">
              Clear Entry?
            </h3>
            <p className="text-gray-300 text-sm mb-6">
              Are you sure you want to clear all content? This action cannot be
              undone.
            </p>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={cancelClear}
                className="px-4 py-2 rounded-lg border border-gray-600 bg-gray-700/50 text-gray-300 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmClear}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Confirm Clear
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );  
};

export default JournalEntry;