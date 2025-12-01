import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import FloatingShape from "./components/FloatingShape";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import { useAuthStore } from "./store/authStore";
import LoadingSpinner from "./components/LoadingSpinner";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import StarterPage from "./pages/StarterPage";
import SettingPage from "./pages/SettingPage";
import JournalWritingPage from "./pages/JournalWritingPage";
import AdminPage from "./pages/AdminPage";
import AllJournalPage from "./pages/AllJournalPage";
import DeviationControllerPage from "./pages/DeviationPage";
import SupportChatPage from "./pages/SupportChatPage";
import NotificationToastDisplay from "./components/NotificationToastDisplay";
import AIChatbot from "./components/AIChatbot";
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!user.isVerified) {
    return <Navigate to="/verify-email" replace />;
  }
  if (!allowedRoles?.includes(user.role)) {
    return <Navigate to={user.role === "admin" ? "/admin/user-management" : "/home"} replace />;
  }

  return children;
};
const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user?.isVerified) {
    if (user.role === "admin") {
      return <Navigate to="/admin/user-management" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  return children;
};
function App() {
  const { isCheckingAuth, checkAuth } = useAuthStore();
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 fixed top-0 left-0">
      {/* Global Loading Spinner Overlay */}
      {isCheckingAuth && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <LoadingSpinner />
        </div>
      )}

      {/* Background floating shapes - fixed positioning */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <FloatingShape
          color="bg-green-500"
          size="w-64 h-64"
          top="-5%"
          left="10%"
          delay={0}
        />
        <FloatingShape
          color="bg-emerald-500"
          size="w-48 h-48"
          top="70%"
          left="80%"
          delay={5}
        />
        <FloatingShape
          color="bg-lime-500"
          size="w-32 h-32"
          top="40%"
          left="-10%"
          delay={2}
        />
      </div>

      {/* Routes Container */}
      <div className="relative w-full h-full overflow-auto">
        <Routes>
          <Route
            path="/"
            element={
              <RedirectAuthenticatedUser>
                <StarterPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/home/*"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/:tab?"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <RedirectAuthenticatedUser>
                <SignUpPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/login"
            element={
              <RedirectAuthenticatedUser>
                <LoginPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route
            path="/forgot-password"
            element={
              <RedirectAuthenticatedUser>
                <ForgotPasswordPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <RedirectAuthenticatedUser>
                <ResetPasswordPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/journal-entry"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <JournalWritingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/all-journals-entries"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <AllJournalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <SettingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/deviation"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <DeviationControllerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support-chat"
            element={
              <ProtectedRoute allowedRoles={["user", "admin"]}>
                <SupportChatPage />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster />
        <NotificationToastDisplay />
        <AIChatbot />
      </div>
    </div>
  );
}

export default App;
