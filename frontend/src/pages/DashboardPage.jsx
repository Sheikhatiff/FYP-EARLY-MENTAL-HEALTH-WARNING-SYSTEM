import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";
import { useJournalStore } from "../store/journalStore.js";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  LogOut,
  Settings,
  BookOpen,
  Home,
  Heart,
  Target,
  PenTool,
  TrendingUp,
  Smile,
  Frown,
  Meh,
  Zap,
  Cloud,
  MessageCircle,
} from "lucide-react";
import NotificationBell from "../components/NotificationBell.jsx";
import NotificationCenter from "../components/NotificationCenter.jsx";
import JournalWritingPage from "./JournalWritingPage.jsx";
import AllJournalPage from "./AllJournalPage.jsx";
import DeviationPage from "./DeviationPage.jsx";
import SettingPage from "./SettingPage.jsx";
import MoodVisualization from "../components/MoodVisualization.jsx";

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showNotifications, setShowNotifications] = useState(false);

  // Determine current tab from URL path
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/write')) return 'write';
    if (path.includes('/journals') || path.includes('/all-journals-entries')) return 'journals';
    if (path.includes('/emotions')) return 'emotions';
    if (path.includes('/goals')) return 'goals';
    if (path.includes('/settings')) return 'settings';
    return 'overview';
  };

  const activeTab = getCurrentTab();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
  };
 
  const navigationItems = [
    { id: "overview", label: "Overview", icon: Home, path: "/home" },
    { id: "write", label: "Write Entry", icon: PenTool, path: "/home/write" },
    { id: "journals", label: "Journal Entries", icon: BookOpen, path: "/home/all-journals-entries" },
    { id: "emotions", label: "Emotion Tracking", icon: Heart, path: "/home/emotions" },
    { id: "goals", label: "Mood Visualization", icon: Target, path: "/home/goals" },
    { id: "support", label: "Community Support", icon: MessageCircle, path: "/support-chat" },
    { id: "settings", label: "Settings", icon: Settings, path: "/home/settings" },
  ];

  const handleNavigation = (item) => {
    navigate(item.path);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-green-900/20 to-emerald-900/20 text-white">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } bg-gray-800/95 backdrop-blur-sm border-r border-green-500/30 transition-all duration-300 overflow-hidden flex flex-col fixed lg:relative h-full z-40 lg:z-auto`}
      >
        {/* User Profile Card - Enlarged */}
        <div className="px-4 py-6 border-b border-green-500/20">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 p-0.5">
              <div className="w-full h-full rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                {user?.photo ? (
                  <img
                    src={`http://localhost:5000/img/users/${user.photo}`}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-3xl font-bold text-emerald-400">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <div className="w-full">
              <div className="font-semibold text-white text-lg truncate">{user?.name}</div>
              <div className="text-xs text-gray-400 truncate mt-1">{user?.email}</div>
              <div className="text-xs text-gray-500 mt-2">
                <p>Created: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</p>
                <p>Last Login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "N/A"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400"
                    : "text-gray-300 hover:bg-gray-700/50 hover:text-emerald-400"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-green-500/20 px-3 py-4 space-y-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-gray-800/30 backdrop-blur-sm border-b border-green-500/20 flex items-center justify-between pr-6 pl-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <img src="/LOGO-1.svg" alt="PsychePulse" className="m-0 p-0 w-60 h-20" />
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell onClick={() => setShowNotifications(true)} />
            <div className="w-px h-8 bg-emerald-500/20"></div>
            <button className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center hover:scale-105 transition-transform">
              <span className="text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </button>
          </div>
        </header> 

        {/* Notification Modal */}
        {showNotifications && (
          <>
            {/* Backdrop - clicked to close */}
            <button
              onClick={() => setShowNotifications(false)}
              className="fixed inset-0 z-30 bg-black/50"
              aria-label="Close notifications"
            />
            
            {/* Modal Panel */}
            <div className="fixed top-24 right-6 z-40 w-96 h-[500px] pointer-events-auto">
              <div className="bg-gray-900 border border-green-500/30 rounded-lg shadow-lg h-full overflow-hidden flex flex-col">
                <NotificationCenter onClose={() => setShowNotifications(false)} />
              </div>
            </div>
          </>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-900 dashboard-scrollbar">
          {activeTab === "overview" && <OverviewTab user={user} navigate={navigate} />}
          {activeTab === "write" && <WriteEntryPage />}
          {activeTab === "journals" && <JournalEntriesPage />}
          {activeTab === "emotions" && <EmotionsPage />}
          {activeTab === "goals" && <GoalsTab />}
          {activeTab === "settings" && <SettingPage isDashboard={true} />}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

// Tab Components
const OverviewTab = ({ user, navigate }) => {
  const { journals, getAllJournals } = useJournalStore();
  const entries = journals?.length || 0;

  // Fetch journals on mount
  useEffect(() => {
    getAllJournals();
  }, [getAllJournals]);

  // Get last 3 entries
  const recentEntries = journals
    ? journals
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3)
    : [];

  // Calculate streak days (consecutive days with entries)
  const calculateStreak = () => {
    if (!journals || journals.length === 0) return 0;
    
    const sortedByDate = journals
      .filter(j => j.createdAt)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedByDate.length - 1; i++) {
      const currentDate = new Date(sortedByDate[i].createdAt);
      const nextDate = new Date(sortedByDate[i + 1].createdAt);
      currentDate.setHours(0, 0, 0, 0);
      nextDate.setHours(0, 0, 0, 0);
      
      const diffTime = Math.abs(currentDate - nextDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Analyze emotion distribution
  const getEmotionDistribution = () => {
    const emotionMap = {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      neutral: 0,
      surprise: 0,
      disgust: 0,
    };

    if (journals && journals.length > 0) {
      journals.forEach(journal => {
        if (journal.analysis && typeof journal.analysis === 'object') {
          Object.keys(journal.analysis).forEach(emotion => {
            const lowerEmotion = emotion.toLowerCase();
            if (lowerEmotion in emotionMap) {
              emotionMap[lowerEmotion]++;
            }
          });
        }
      });
    }

    // Get top emotions
    const topEmotions = Object.entries(emotionMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([emotion, count]) => ({ emotion, count }));

    return { emotionMap, topEmotions };
  };

  const streakDays = calculateStreak();
  const { emotionMap, topEmotions } = getEmotionDistribution();

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-600/10 border border-green-500/20 rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-2">Welcome Back, {user?.name}! 👋</h2>
          <p className="text-gray-400">
            Continue your journey of self-discovery and emotional growth.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            icon={BookOpen}
            label="Journal Entries"
            value={entries}
            color="green"
          />
          <StatCard
            icon={Heart}
            label="Streak Days"
            value={streakDays}
            color="emerald"
          />
          <EmotionCard topEmotions={topEmotions} emotionMap={emotionMap} />
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800/40 border border-green-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-emerald-300">Recent Activity</h3>
          <div className="space-y-3">
            {recentEntries.length > 0 ? (
              recentEntries.map((entry) => (
                <div
                  key={entry._id}
                  onClick={() => {
                    navigate(`/home/journals?entry=${entry._id}`);
                  }}
                  className="flex items-center gap-4 p-3 bg-green-500/5 border border-green-500/10 rounded-lg hover:bg-green-500/20 transition-colors cursor-pointer"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-emerald-300">{entry.title}</div>
                    <div className="text-xs text-gray-400">{formatDate(entry.createdAt)}</div>
                  </div>
                  <div className="text-xs text-green-400">View</div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No journal entries yet. Start writing to see your recent activity!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmotionCard = ({ topEmotions, emotionMap }) => {
  const emotionEmojis = {
    joy: "😊",
    sadness: "😢",
    anger: "😠",
    fear: "😨",
    neutral: "😐",
    surprise: "😲",
    disgust: "🤢",
  };

  const emotionColors = {
    joy: "from-yellow-400 to-orange-500",
    sadness: "from-blue-400 to-indigo-500",
    anger: "from-red-400 to-red-600",
    fear: "from-purple-400 to-purple-600",
    neutral: "from-gray-400 to-gray-600",
    surprise: "from-pink-400 to-pink-600",
    disgust: "from-green-400 to-green-600",
  };

  const totalEmotions = Object.values(emotionMap).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-gray-800/40 border border-green-500/20 rounded-xl p-6 hover:border-green-500/40 transition-all">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Emotional Landscape</h3>
        <p className="text-xs text-gray-400">{totalEmotions} emotions tracked</p>
      </div>

      {topEmotions && topEmotions.length > 0 ? (
        <div className="space-y-3">
          {topEmotions.map(({ emotion, count }, idx) => (
            <motion.div
              key={emotion}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center gap-3"
            >
              <span className="text-2xl">{emotionEmojis[emotion] || "💭"}</span>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-300 capitalize">
                    {emotion}
                  </span>
                  <span className="text-xs text-green-400 font-semibold">{count}</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: totalEmotions > 0 ? `${(count / totalEmotions) * 100}%` : 0,
                    }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className={`h-full bg-gradient-to-r ${
                      emotionColors[emotion] || "from-green-400 to-emerald-500"
                    }`}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-gray-400 text-sm">No emotions tracked yet</p>
          <p className="text-xs text-gray-500 mt-1">Start journaling to track emotions</p>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    green: "from-green-500 to-green-600",
    emerald: "from-emerald-500 to-emerald-600",
    teal: "from-teal-500 to-teal-600",
  };

  return (
    <div className="bg-gray-800/40 border border-green-500/20 rounded-xl p-6 hover:border-green-500/40 transition-all flex flex-col items-center justify-center text-center">
      <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-lg flex items-center justify-center mb-4`}>
        {Icon && <Icon className="w-6 h-6 text-white" />}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
};

// Import actual components
const WriteEntryPage = () => {
  return <JournalWritingPage isDashboard={true} />;
};

const JournalEntriesPage = () => {
  return <AllJournalPage isDashboard={true} />;
};

const EmotionsPage = () => {
  return <DeviationPage isDashboard={true} />;
};

const GoalsTab = () => {
  return <MoodVisualization />;
};

export default DashboardPage;
