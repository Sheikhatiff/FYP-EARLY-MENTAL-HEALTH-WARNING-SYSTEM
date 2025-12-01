import express from "express";
import {
  getNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markMultipleAsRead,
  dismissNotification,
  deleteNotification,
  clearAllNotifications,
  getCriticalNotifications,
  sendBroadcastNotification,
} from "../controllers/notification.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const notificationRouter = express.Router();

// All routes require authentication
notificationRouter.use(verifyToken);

// Middleware to attach io instance
notificationRouter.use((req, res, next) => {
  req.io = req.app.get("io");
  next();
});

// Get all notifications with pagination and filtering
// Query: ?read=true/false&type=TYPE&severity=SEVERITY&limit=20&page=1
notificationRouter.get("/", getNotifications);

// Get unread notifications count
notificationRouter.get("/count/unread", getUnreadCount);

// Get critical notifications (dashboard)
notificationRouter.get("/critical/all", getCriticalNotifications);

// Get notification by ID
notificationRouter.get("/:id", getNotificationById);

// Mark notification as read
notificationRouter.patch("/:id/read", markAsRead);

// Mark multiple notifications as read
notificationRouter.post("/read/batch", markMultipleAsRead);

// Dismiss notification (but keep it in history)
notificationRouter.patch("/:id/dismiss", dismissNotification);

// Delete notification permanently
notificationRouter.delete("/:id", deleteNotification);

// Clear all notifications
notificationRouter.delete("/", clearAllNotifications);

// Send broadcast notification to all users with role "user"
notificationRouter.post("/broadcast/send", sendBroadcastNotification);

export default notificationRouter;
