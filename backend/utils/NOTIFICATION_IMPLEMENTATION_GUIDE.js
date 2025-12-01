/**
 * NOTIFICATION SYSTEM - IMPLEMENTATION GUIDE
 * 
 * This file provides examples and documentation for using the notification system
 * throughout the application
 */

// ============================================================================
// BACKEND INTEGRATION EXAMPLES
// ============================================================================

/**
 * EXAMPLE 1: Creating a notification manually
 * Use in your controllers
 */
import { createNotification } from "../controllers/notification.controller.js";

async function exampleManualNotification() {
  const notification = await createNotification({
    userId: "user_id_here",
    type: "DEVIATION_ALERT",
    severity: "high",
    title: "Anxiety Level Increased ⬆️",
    message: "Your anxiety level has increased by 45% from your baseline.",
    description: `Current: 7.2 | Baseline: 5.0 | Deviation Score: 0.68`,
    triggerData: {
      emotionType: "anxiety",
      deviationScore: 0.68,
      baselineValue: 5.0,
      currentValue: 7.2,
      percentageChange: 45,
      alertReason: "Significant deviation from baseline",
    },
    action: "NONE",
  });
}

/**
 * EXAMPLE 2: Integrating notifications with deviation detection
 * In your journal.controller.js or baseline_deviation.controller.js
 */
import { processNotificationsFromAlerts } from "../utils/notificationIntegration.js";

async function exampleDeviationDetectionWithNotifications(userId, entryAnalysis) {
  try {
    // ... your deviation detection logic ...

    // After detecting issues, create notifications
    if (analysis.alerts && analysis.alerts.length > 0) {
      await processNotificationsFromAlerts(
        userId,
        analysis.alerts,
        analysis.emotionData,
        analysis.baselineData
      );
    }

    // Notify about baseline update
    if (analysis.baselineUpdated) {
      const { notifyBaselineUpdated } = await import(
        "../utils/notificationIntegration.js"
      );
      await notifyBaselineUpdated(
        userId,
        analysis.entryCount,
        "Your emotional baseline has been refined with this new entry"
      );
    }
  } catch (error) {
    console.error("Error in deviation detection with notifications:", error);
  }
}

/**
 * EXAMPLE 3: Sending achievement notifications
 * Call when user reaches milestones
 */
import { notifyPositiveAchievement } from "../utils/notificationIntegration.js";

async function exampleAchievementNotification(userId) {
  // First entry
  await notifyPositiveAchievement(userId, "first_entry");

  // Tenth entry
  await notifyPositiveAchievement(userId, "tenth_entry");

  // Mood improvement
  await notifyPositiveAchievement(userId, "improved_mood");
}

// ============================================================================
// FRONTEND INTEGRATION EXAMPLES
// ============================================================================

/**
 * EXAMPLE 4: Using the notification store in a component
 */
import { useNotificationStore } from "../store/notificationStore";

function ExampleComponent() {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    deleteNotification,
  } = useNotificationStore();

  useEffect(() => {
    // Fetch notifications on mount
    fetchNotifications({ read: false, limit: 10 });

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications({ read: false });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      {notifications.map((notif) => (
        <div key={notif._id}>
          <h3>{notif.title}</h3>
          <p>{notif.message}</p>
          <button onClick={() => markAsRead(notif._id)}>
            Mark as Read
          </button>
          <button onClick={() => deleteNotification(notif._id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * EXAMPLE 5: Adding notification bell to header
 */
import NotificationBell from "../components/NotificationBell";
import NotificationCenter from "../components/NotificationCenter";
import { useState } from "react";

function HeaderWithNotifications() {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="flex items-center justify-between p-4 bg-white shadow">
      <h1>My App</h1>
      <div className="flex items-center gap-4">
        <NotificationBell onClick={() => setShowNotifications(true)} />
        {showNotifications && (
          <NotificationCenter
            onClose={() => setShowNotifications(false)}
          />
        )}
      </div>
    </header>
  );
}

/**
 * EXAMPLE 6: Showing notification toasts
 */
import { showNotificationToast } from "../components/NotificationToast";

function ExampleToastNotifications() {
  // Show a notification as a toast
  const notification = {
    type: "RISK_ALERT",
    severity: "critical",
    title: "Mental Health Alert",
    message: "Persistent negativity detected in recent entries",
    action: { type: "TAKE_ACTION", label: "Get Help" },
  };

  const handleNotification = () => {
    showNotificationToast(notification);
  };

  return (
    <button onClick={handleNotification}>
      Show Critical Alert Toast
    </button>
  );
}

/**
 * EXAMPLE 7: Using notification preferences
 */
import NotificationPreferences from "../components/NotificationPreferences";

function SettingsPage() {
  return (
    <div className="settings-container">
      <h1>Settings</h1>
      <NotificationPreferences />
    </div>
  );
}

// ============================================================================
// API ENDPOINTS - QUICK REFERENCE
// ============================================================================

/**
 * Available API endpoints for notifications:
 * 
 * GET    /api/v1/notifications              - Get all notifications
 * GET    /api/v1/notifications/:id          - Get notification by ID
 * PATCH  /api/v1/notifications/:id/read     - Mark as read
 * POST   /api/v1/notifications/read/batch   - Mark multiple as read
 * PATCH  /api/v1/notifications/:id/dismiss  - Dismiss notification
 * DELETE /api/v1/notifications/:id          - Delete notification
 * GET    /api/v1/notifications/count/unread - Get unread count
 * GET    /api/v1/notifications/critical/all - Get critical notifications
 * DELETE /api/v1/notifications              - Clear all notifications
 */

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

/**
 * Available notification types:
 * 
 * DEVIATION_ALERT       - When emotions deviate from baseline
 * SPIKE_WARNING         - When sudden emotional spikes detected
 * POSITIVE_MILESTONE    - Positive achievements and improvements
 * RISK_ALERT            - Critical mental health warnings
 * PATTERN_WARNING       - Unusual patterns detected
 * BASELINE_UPDATE       - Baseline updated with new data
 * INFO                  - General informational notifications
 */

// ============================================================================
// SEVERITY LEVELS
// ============================================================================

/**
 * Available severity levels (in order of urgency):
 * 
 * critical  - Immediate action required, critical mental health concerns
 * high      - Important, needs attention soon
 * medium    - Standard alerts
 * low       - Minor informational alerts
 * info      - General informational messages
 */

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

/**
 * Filtering notifications with query parameters:
 * 
 * ?read=true           - Get read notifications
 * ?read=false          - Get unread notifications
 * ?type=DEVIATION_ALERT- Filter by notification type
 * ?severity=critical   - Filter by severity level
 * ?limit=20            - Limit results (default: 20)
 * ?page=1              - Pagination (default: 1)
 * 
 * Examples:
 * GET /api/v1/notifications?read=false&severity=high&limit=10
 * GET /api/v1/notifications?type=RISK_ALERT&page=2
 */

// ============================================================================
// NOTIFICATION WORKFLOW
// ============================================================================

/**
 * Typical notification workflow:
 * 
 * 1. Event occurs (journal entry created, deviation detected)
 * 2. Analysis is performed (deviation score, patterns, etc.)
 * 3. Notification is created with relevant data
 * 4. Frontend fetches notification
 * 5. User receives notification (toast, bell, center)
 * 6. User can interact (read, dismiss, delete)
 * 7. Notification is archived or deleted
 */

// ============================================================================
// REAL-TIME NOTIFICATIONS (FUTURE)
// ============================================================================

/**
 * For real-time notifications, implement WebSocket support:
 * 
 * 1. Add Socket.io to backend
 * 2. Emit notifications in real-time when created
 * 3. Connect frontend to WebSocket on component mount
 * 4. Listen for 'notification' events
 * 5. Add notification to store immediately
 * 6. Show toast notification to user
 * 
 * Example:
 * socket.on('notification', (notification) => {
 *   useNotificationStore.getState().addNotification(notification);
 *   showNotificationToast(notification);
 * });
 */

export default {
  documentation: "See comments above for implementation examples",
};
