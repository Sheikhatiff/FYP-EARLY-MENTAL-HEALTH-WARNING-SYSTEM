import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Search,
  Settings,
  Plus,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  LogOut,
  Users,
  UserCheck,
  UserX,
  UserPlus,
  X,
  User,
  Mail,
  Calendar,
  Check,
  Clock,
  ShieldCheck,
  Send,
  MessageCircle,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { useAuthStore } from "../store/authStore.js";
import { useAdminStore } from "../store/adminStore.js";
import BroadcastNotificationModal from "../components/BroadcastNotificationModal.jsx";
import SettingPage from "./SettingPage.jsx";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Sidebar Component
const Sidebar = ({
  user,
  onLogout,
  activeTab,
  onTabChange,
  formatDate,
}) => {
  const navigationItems = [
    { id: "user-management", label: "User Management", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="w-72 bg-gray-800/90 backdrop-blur-sm border-r border-emerald-500/30 p-6 flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Dashboard Title */}
      <div className="mb-10 flex items-center justify-center">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent tracking-tight">
          Admin
        </h1>
      </div>

      {/* Admin Profile */}
      <div className="mb-8">
        <div className="flex flex-col items-center text-center">
          {/* Profile Image */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg mb-3"
            style={{
              backgroundImage: user?.photo
                ? `url(http://localhost:5000/img/users/${user.photo})`
                : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {!user?.photo && (user?.name?.charAt(0).toUpperCase() || "A")}
          </div>

          {/* Name & Email */}
          <h3 className="text-lg font-semibold text-white">
            {user?.name || "Admin User"}
          </h3>
          <p className="text-sm text-gray-400">
            {user?.email || "admin@example.com"}
          </p>
        </div>

        {/* Last Login */}
        <div className="bg-gray-700/50 rounded-lg p-3 mt-5 text-center">
          <p className="text-xs text-gray-400">Last Login</p>
          <p className="text-sm text-emerald-400 font-medium">
            {formatDate(user?.lastLogin) || "Today, 2:30 PM"}
          </p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
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

      {/* Logout Button */}
      <div className="border-t border-emerald-500/20 px-3 py-4 space-y-1">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

// Search and Filter Component
const SearchFilterBar = ({
  searchTerm,
  onSearchChange,
  selectedFilter,
  onFilterChange,
}) => {
  const filterOptions = [
    { value: "all", label: "All Time" },
    { value: "1day", label: "1 Day" },
    { value: "1week", label: "1 Week" },
    { value: "1month", label: "1 Month" },
    { value: "6months", label: "6 Months" },
    { value: "1year", label: "1 Year" },
  ];

  const quickFilters = ["1day", "1week", "1month"];

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-4 lg:p-6 mb-6">
      {/* Single Row Layout for Desktop, Two Rows on Mobile */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-emerald-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Filter Select */}
        <div className="relative w-full lg:w-48">
          <select
            value={selectedFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="appearance-none bg-gray-700 border border-emerald-500/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer w-full text-sm"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 lg:pb-0">
          <span className="text-sm text-gray-400 whitespace-nowrap">
            Quick:
          </span>
          {quickFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                selectedFilter === filter
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500"
                  : "bg-gray-700 text-gray-400 border border-gray-600 hover:border-emerald-500/50"
              }`}
            >
              {filterOptions.find((opt) => opt.value === filter)?.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// User Management Table Component
const UserManagementTable = ({
  users,
  totalUsers,
  onEdit,
  onDelete,
  onView,
  formatDate,
}) => {
  return (
    <div className="bg-gray-800/80 backdrop-blur-sm border border-emerald-500/30 rounded-2xl overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-700/70 px-4 lg:px-6 py-4">
        <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
          <div className="col-span-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            User Name
          </div>
          <div className="col-span-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Email
          </div>
          <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Last Login
          </div>
          <div className="col-span-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Status
          </div>
          <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">
            Actions
          </div>
        </div>
        <div className="lg:hidden">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            User Management ({totalUsers} users)
          </h3>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-700/50">
        {users.length === 0 ? (
          <div className="px-4 lg:px-6 py-8 flex flex-col lg:flex-row lg:grid lg:grid-cols-12 gap-4 items-center justify-center min-h-[200px] text-gray-400">
            {/* Desktop placeholder */}
            <div className="hidden lg:flex col-span-12 justify-center">
              No users found
            </div>
            {/* Mobile placeholder */}
            <div className="lg:hidden text-center">No users found</div>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user._id}
              className="px-4 lg:px-6 py-4 lg:py-5 hover:bg-gray-700/30 transition-colors duration-200"
            >
              {/* Desktop Layout */}
              <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                <div className="col-span-4 flex items-center space-x-4">
                  <div
                    className="w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{
                      backgroundImage: user?.photo
                        ? `url(http://localhost:5000/img/users/${user.photo})`
                        : "url(http://localhost:5000/img/users/default.png)",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {!user?.photo && (user?.initials || "AD")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-white truncate">
                      {user.name}
                    </div>
                    <div className="text-sm text-gray-400 truncate">
                      {user.role}
                    </div>
                  </div>
                </div>

                <div className="col-span-3 text-gray-300 truncate">
                  {user.email}
                </div>

                <div className="col-span-2 text-gray-300 text-sm">
                  {formatDate(user.lastLogin)}
                </div>

                <div className="col-span-1">
                  <div className="flex items-center space-x-1">
                    <div className="relative">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          user.isOnline ? "bg-emerald-400" : "bg-gray-500"
                        }`}
                      ></div>
                      {user.isOnline && (
                        <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        user.isOnline ? "text-emerald-400" : "text-gray-500"
                      }`}
                    >
                      {user.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>

                <div className="col-span-2 flex items-center justify-center space-x-2">
                  <button
                    onClick={() => onView(user._id)}
                    className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500 text-emerald-400 rounded-lg transition-all duration-200 hover:scale-105"
                    title="View User"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(user._id)}
                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500 text-blue-400 rounded-lg transition-all duration-200 hover:scale-105"
                    title="Edit User"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(user._id)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500 text-red-400 rounded-lg transition-all duration-200 hover:scale-105"
                    title="Delete User"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="lg:hidden space-y-3">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ backgroundColor: user.avatar }}
                  >
                    {user.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-white truncate">
                      {user.name}
                    </div>
                    <div className="text-sm text-gray-400 truncate">
                      {user.role}
                    </div>
                    <div className="text-sm text-gray-300 truncate">
                      {user.email}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="relative">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          user.isOnline ? "bg-emerald-400" : "bg-gray-500"
                        }`}
                      ></div>
                      {user.isOnline && (
                        <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        user.isOnline ? "text-emerald-400" : "text-gray-500"
                      }`}
                    >
                      {user.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Last login: {user.lastLogin}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onView(user._id)}
                      className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500 text-emerald-400 rounded-lg transition-all duration-200"
                      title="View User"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(user.id)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500 text-blue-400 rounded-lg transition-all duration-200"
                      title="Edit User"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(user.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500 text-red-400 rounded-lg transition-all duration-200"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

// Main Admin Page Component
const AdminPage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { tab } = useParams();
  
  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
  };

  const {
    users,
    getAllUsers,
    adminUpdateUser,
    getUserById,
    deleteUser,
    isLoading,
    error,
    createUser,
    selectedUser,
    initSocket,
    disconnectSocket,
  } = useAdminStore();

  // Local state - sync with URL parameter
  const [activeTab, setActiveTab] = useState(tab || "user-management");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    password: "",
    passwordConfirm: "",
    role: "user",
    email: "",
  });
  const [editError, setEditError] = useState("");
  const usersPerPage = 6;

  // Load users on component mount
  useEffect(() => {
    getAllUsers();
    initSocket();
    
    return () => {
      disconnectSocket();
    };
  }, [getAllUsers, initSocket, disconnectSocket]);

  // Sync active tab with URL parameter
  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    } else {
      // Redirect to default tab if no tab specified
      navigate("/admin/user-management", { replace: true });
    }
  }, [tab, navigate]);

  // Filter out admin users for User Management view
  const nonAdminUsers = useMemo(() => {
    return users.filter(user => user?.role !== 'admin');
  }, [users]);

  const filteredUsers = useMemo(() => {
    let filtered = nonAdminUsers.filter(
      (user) =>
        user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedFilter !== "all") {
      filtered = filtered.filter((user) => {
        const lastLogin = user?.lastLogin?.toLowerCase() || "";
        switch (selectedFilter) {
          case "1day":
            return (
              lastLogin.includes("hour") ||
              lastLogin.includes("minute") ||
              lastLogin === "today"
            );
          case "1week":
            return (
              lastLogin.includes("day") ||
              lastLogin.includes("hour") ||
              lastLogin.includes("minute")
            );
          case "1month":
            return (
              !lastLogin.includes("week") &&
              !lastLogin.includes("month") &&
              !lastLogin.includes("year")
            );
          case "6months":
            return !lastLogin.includes("year");
          case "1year":
            return true;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [nonAdminUsers, searchTerm, selectedFilter]);

  // Get paginated users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    return filteredUsers.slice(startIndex, startIndex + usersPerPage);
  }, [filteredUsers, currentPage, usersPerPage]);

  // Event handlers
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterValue) => {
    setSelectedFilter(filterValue);
    setCurrentPage(1);
  };

  const handleView = (userId) => {
    getUserById(userId);
    setIsModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const isUpdatingPassword =
      editData.password && editData.password.trim() !== "";
    if (isUpdatingPassword) {
      if (!editData.passwordConfirm || editData.passwordConfirm.trim() === "") {
        setEditError("Please confirm your password!");
        return;
      }
      if (editData.password !== editData.passwordConfirm) {
        setEditError("Passwords do not match!");
        return;
      }
    }
    setEditError("");
    const submitData = { ...editData };
    if (!isUpdatingPassword) {
      delete submitData.password;
      delete submitData.passwordConfirm;
    }

    adminUpdateUser(selectedUser._id, submitData);

    console.log("Updated User Data:", submitData);
    setIsEditModalOpen(false);
  };
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (editData.password !== editData.passwordConfirm) {
      setEditError("Passwords do not match!");
      return;
    }
    setEditError("");
    createUser(editData);
    console.log("Updated User Data:", editData);
    setShowAddUserModal(false);
  };

  const handleEdit = (userId) => {
    console.log("Edit user ID:", userId);
    getUserById(userId);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser(userId);
        console.log("User deleted successfully");
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleAddUser = () => {
    setShowAddUserModal(true);
  };

  const handleSendNotification = () => {
    setShowBroadcastModal(true);
  };

  const handleTabChange = (tabId) => {
    navigate(`/admin/${tabId}`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  const getTimeSince = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Less than an hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} weeks ago`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // User Management Content Component
  const UserManagementContent = () => {
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    return (
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            User Management
          </h1>
          <button
            onClick={handleAddUser}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Add User
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800/80 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Users</p>
                <p className="text-xl font-bold text-white">{nonAdminUsers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Online</p>
                <p className="text-xl font-bold text-white">
                  {nonAdminUsers.filter((u) => u?.isOnline).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-500/20 rounded-lg">
                <UserX className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Offline</p>
                <p className="text-xl font-bold text-white">
                  {nonAdminUsers.filter((u) => !u?.isOnline).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Search className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Filtered</p>
                <p className="text-xl font-bold text-white">{filteredUsers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <SearchFilterBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          selectedFilter={selectedFilter}
          onFilterChange={handleFilterChange}
          totalUsers={nonAdminUsers.length}
          filteredCount={filteredUsers.length}
        />

        {/* Pagination Top */}
        <div className="bg-gray-700/30 px-4 lg:px-6 py-4 rounded-t-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="text-sm text-gray-400">
              Showing {(currentPage - 1) * usersPerPage + 1}-{Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
            </div>

            <div className="flex items-center justify-center lg:justify-end space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-400 hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentPage === page
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-700 text-gray-400 hover:border-emerald-500/50 border border-gray-600"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-400 hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* User Management Table */}
        <div className="overflow-y-auto" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgb(16, 185, 129) rgb(31, 41, 55)'
        }}>
          <style>{`
            .scrollable-table::-webkit-scrollbar {
              width: 8px;
            }
            .scrollable-table::-webkit-scrollbar-track {
              background: rgb(31, 41, 55);
              border-radius: 10px;
            }
            .scrollable-table::-webkit-scrollbar-thumb {
              background: rgb(16, 185, 129);
              border-radius: 10px;
            }
            .scrollable-table::-webkit-scrollbar-thumb:hover {
              background: rgb(5, 150, 105);
            }
          `}</style>
          <div className="scrollable-table">
            <UserManagementTable
              users={paginatedUsers}
              totalUsers={filteredUsers.length}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              formatDate={formatDate}
            />
          </div>
        </div>
      </div>
    );
  };

  // Analytics Content Component
  const AnalyticsContent = () => {
    // Calculate user statistics
    const totalUsers = users.length;
    const onlineUsers = users.filter(u => u?.isOnline).length;
    const offlineUsers = totalUsers - onlineUsers;
    const verifiedUsers = users.filter(u => u?.isVerified).length;
    const unverifiedUsers = totalUsers - verifiedUsers;
    const adminUsers = users.filter(u => u?.role === 'admin').length;
    const regularUsers = totalUsers - adminUsers;

    // User registration over time (last 12 months with year)
    const monthlyData = useMemo(() => {
      const months = [];
      const now = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const count = users.filter(u => {
          const userDate = new Date(u.createdAt);
          return userDate.getMonth() === date.getMonth() && 
                 userDate.getFullYear() === date.getFullYear();
        }).length;
        months.push({ name: monthYear, users: count });
      }
      return months;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [users.length]);

    // Role distribution data for pie chart
    const roleData = [
      { name: 'Regular Users', value: regularUsers, color: '#10b981' },
      { name: 'Admins', value: adminUsers, color: '#a855f7' },
    ];

    // Status distribution data
    const statusData = [
      { name: 'Online', value: onlineUsers, color: '#22c55e' },
      { name: 'Offline', value: offlineUsers, color: '#6b7280' },
    ];

    const verificationData = [
      { name: 'Verified', value: verifiedUsers, color: '#3b82f6' },
      { name: 'Unverified', value: unverifiedUsers, color: '#6b7280' },
    ];

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-gray-800 border border-emerald-500/30 rounded-lg p-3 shadow-xl">
            <p className="text-emerald-400 font-medium mb-1">{label}</p>
            {payload.map((entry, index) => (
              <p key={index} className="text-white text-sm">
                {entry.name}: <span className="font-bold">{entry.value}</span>
              </p>
            ))}
          </div>
        );
      }
      return null;
    };

    return (
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Comprehensive insights and user statistics</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800/80 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{totalUsers}</p>
            <p className="text-sm text-gray-400">Total Users</p>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-xs text-green-400 font-medium">{totalUsers ? Math.round((onlineUsers/totalUsers)*100) : 0}%</div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{onlineUsers}</p>
            <p className="text-sm text-gray-400">Online Now</p>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Check className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-xs text-blue-400 font-medium">{totalUsers ? Math.round((verifiedUsers/totalUsers)*100) : 0}%</div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{verifiedUsers}</p>
            <p className="text-sm text-gray-400">Verified</p>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-xs text-purple-400 font-medium">{totalUsers ? Math.round((adminUsers/totalUsers)*100) : 0}%</div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{adminUsers}</p>
            <p className="text-sm text-gray-400">Admin Users</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Registration Trend - Line Chart */}
          <div className="bg-gray-800/80 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">User Registration Trend</h3>
              <BarChart3 className="w-5 h-5 text-emerald-400" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9ca3af" 
                  style={{ fontSize: '12px' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  style={{ fontSize: '12px' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="New Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* User Registration Bar Chart */}
          <div className="bg-gray-800/80 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Monthly Registrations</h3>
              <BarChart3 className="w-5 h-5 text-emerald-400" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9ca3af" 
                  style={{ fontSize: '12px' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  style={{ fontSize: '12px' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar 
                  dataKey="users" 
                  fill="#10b981" 
                  radius={[8, 8, 0, 0]}
                  name="Users"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Role Distribution Pie Chart */}
          <div className="bg-gray-800/80 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">User Role Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                <p className="text-gray-400 mb-1">Regular Users</p>
                <p className="text-2xl font-bold text-emerald-400">{regularUsers}</p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                <p className="text-gray-400 mb-1">Admin Users</p>
                <p className="text-2xl font-bold text-purple-400">{adminUsers}</p>
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-gray-800/80 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">User Activity Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-gray-400 mb-1">Online Users</p>
                <p className="text-2xl font-bold text-green-400">{onlineUsers}</p>
              </div>
              <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-3">
                <p className="text-gray-400 mb-1">Offline Users</p>
                <p className="text-2xl font-bold text-gray-400">{offlineUsers}</p>
              </div>
            </div>
          </div>

          {/* Verification Status */}
          <div className="bg-gray-800/80 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4">Email Verification Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={verificationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {verificationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col justify-center space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Verified Users</span>
                    <Check className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-3xl font-bold text-blue-400">{verifiedUsers}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {totalUsers ? Math.round((verifiedUsers/totalUsers)*100) : 0}% of total users
                  </p>
                </div>
                <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Unverified Users</span>
                    <X className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-400">{unverifiedUsers}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {totalUsers ? Math.round((unverifiedUsers/totalUsers)*100) : 0}% of total users
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-emerald-900/20 to-gray-900 text-white">
      {/* Sidebar */}
      <Sidebar
        user={user}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        formatDate={formatDate}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden ml-72">
        {/* Top Header */}
        <header className="h-20 bg-gray-800/30 backdrop-blur-sm border-b border-emerald-500/20 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <img src="/LOGO-1.svg" alt="PsychePulse" className="m-0 p-0 w-60 h-20" />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/support-chat")}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              title="Community Support"
            >
              <MessageCircle className="w-6 h-6 text-emerald-400" />
            </button>
            <button
              onClick={handleSendNotification}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              title="Send Notification"
            >
              <Send className="w-6 h-6 text-emerald-400" />
            </button>
            <div className="w-px h-8 bg-emerald-500/20"></div>
            <button className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center hover:scale-105 transition-transform">
              <span className="text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-900 p-6">
          {activeTab === "user-management" && <UserManagementContent />}
          {activeTab === "analytics" && <AnalyticsContent />}
          {activeTab === "settings" && <SettingPage isDashboard={true} />}
        </main>
      </div>

      {/* Modals */}
      {showBroadcastModal && (
        <BroadcastNotificationModal
          isOpen={showBroadcastModal}
          onClose={() => setShowBroadcastModal(false)}
        />
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-emerald-500/30 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Add New User</h3>
            <form onSubmit={handleAddSubmit}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    className="w-full px-4 py-3 bg-gray-700 border border-emerald-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    className="w-full px-4 py-3 bg-gray-700 border border-emerald-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={editData.email}
                    onChange={(e) =>
                      setEditData({ ...editData, email: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    className="w-full px-4 py-3 bg-gray-700 border border-emerald-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={editData.password}
                    onChange={(e) =>
                      setEditData({ ...editData, password: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password Confirm
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    className="w-full px-4 py-3 bg-gray-700 border border-emerald-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={editData.passwordConfirm}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        passwordConfirm: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    value={editData.role}
                    onChange={(e) =>
                      setEditData({ ...editData, role: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-700 border border-emerald-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select a role</option>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              </div>
              {/* Error message */}
              {editError && (
                <p className="text-red-400 text-sm font-medium">{editError}</p>
              )}
            </form>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="flex-1 px-4 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors duration-200 font-medium"
                onClick={handleAddSubmit}
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-emerald-500/30 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Edit User</span>
                </h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Decorative dots */}
              <div className="absolute -bottom-1 left-0 right-0 flex justify-center space-x-2">
                <div className="w-2 h-2 bg-white/30 rounded-full"></div>
                <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                <div className="w-2 h-2 bg-white/30 rounded-full"></div>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="Enter full name"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={editData.password}
                  onChange={(e) =>
                    setEditData({ ...editData, password: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="Enter new password"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={editData.passwordConfirm}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      passwordConfirm: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="Confirm new password"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={editData.role}
                  onChange={(e) =>
                    setEditData({ ...editData, role: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Error message */}
              {editError && (
                <p className="text-red-400 text-sm font-medium">{editError}</p>
              )}
            </form>

            {/* Footer */}
            <div className="bg-gray-700/30 border-t border-gray-600/50 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-6 py-2.5 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-emerald-500/30 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>User Details</span>
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Decorative dots */}
              <div className="absolute -bottom-1 left-0 right-0 flex justify-center space-x-2">
                <div className="w-2 h-2 bg-white/30 rounded-full"></div>
                <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                <div className="w-2 h-2 bg-white/30 rounded-full"></div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {error ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="text-red-400 font-medium">{error}</p>
                </div>
              ) : selectedUser ? (
                <>
                  {/* Profile Section */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div
                        className="w-20 h-20 rounded-full border-4 border-emerald-500/30 flex items-center justify-center text-white font-bold text-2xl overflow-hidden"
                        style={{
                          backgroundImage: selectedUser.photo
                            ? `url(http://localhost:5000/img/users/${selectedUser.photo})`
                            : "url(http://localhost:5000/img/users/default.png)",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      ></div>

                      {/* Verification badge */}
                      {selectedUser.isVerified && (
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-gray-800">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-white truncate">
                        {selectedUser.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-300 text-sm truncate">
                          {selectedUser.email}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <ShieldCheck className="w-4 h-4 text-gray-400" />
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            selectedUser.role === "admin"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {selectedUser.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <Calendar className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-400 uppercase tracking-wide">
                            Member Since
                          </p>
                          <p className="text-sm text-white font-medium">
                            {formatDate(selectedUser.createdAt).split(",")[0]}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                          <Clock className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-400 uppercase tracking-wide">
                            Last Login
                          </p>
                          <p className="text-sm text-white font-medium">
                            {getTimeSince(selectedUser.lastLogin)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="bg-gray-700/30 border border-gray-600/50 rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide border-b border-gray-600 pb-2">
                      Account Details
                    </h4>

                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Email Verified:</span>
                        <div className="flex items-center space-x-2">
                          {selectedUser.isVerified ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-400" />
                              <span className="text-emerald-400 font-medium">
                                Verified
                              </span>
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4 text-red-400" />
                              <span className="text-red-400 font-medium">
                                Not Verified
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Last Updated:</span>
                        <span className="text-gray-300">
                          {formatDate(selectedUser.updatedAt).split(" at ")[0]}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-600/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 font-medium">
                    No user data found
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-700/30 border-t border-gray-600/50 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-emerald-500/30 rounded-2xl p-8">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              <span className="text-white font-medium">Loading...</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500/90 backdrop-blur-sm border border-red-400 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold">!</span>
            </div>
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Notification Modal */}
      <BroadcastNotificationModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
      />
    </div>
  );
};

export default AdminPage;
