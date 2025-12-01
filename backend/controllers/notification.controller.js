import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

/**
 * Create a new notification
 * Internal function - called by various system triggers
 */
export const createNotification = async (notificationData, io = null) => {
  try {
    const {
      userId,
      type,
      severity,
      title,
      message,
      description,
      triggerData,
      journalId,
      action,
      actionData,
    } = notificationData;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const notification = await Notification.create({
      userId,
      type,
      severity: severity || "info",
      title,
      message,
      description,
      triggerData,
      journalId,
      action: action || "NONE",
      actionData,
    });

    console.log(`[Notification] 📝 Created: ID=${notification._id}, Type=${type}, Severity=${severity}, User=${userId}`);

    // Emit real-time notification via Socket.io
    if (io) {
      console.log(`[Notification] 📤 Emitting to room: user:${userId}`);
      io.to(`user:${userId.toString()}`).emit("notification:new", {
        _id: notification._id,
        type: notification.type,
        severity: notification.severity,
        title: notification.title,
        message: notification.message,
        createdAt: notification.createdAt,
        read: notification.read,
      });
      console.log(`[Notification] ✅ Emitted successfully via Socket.io`);
    } else {
      console.warn(`[Notification] ⚠️ No io instance - DB saved but NOT emitted in real-time`);
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Get all notifications for a user
 * Query: ?read=true/false&type=TYPE&severity=SEVERITY&limit=20&page=1
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      read,
      type,
      severity,
      limit = 20,
      page = 1,
    } = req.query;

    // Build filter
    const filter = { userId };

    if (read !== undefined) {
      filter.read = read === "true";
    }

    if (type) {
      filter.type = type;
    }

    if (severity) {
      filter.severity = severity;
    }

    const skip = (page - 1) * limit;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Notification.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          current: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
      error: error.message,
    });
  }
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await Notification.countDocuments({
      userId,
      read: false,
    });

    res.status(200).json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching unread count",
      error: error.message,
    });
  }
};

/**
 * Get notification by ID
 */
export const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: id,
      userId,
    }).populate("journalId");

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { notification },
    });
  } catch (error) {
    console.error("Error fetching notification:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notification",
      error: error.message,
    });
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      {
        read: true,
        readAt: new Date(),
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Emit real-time event
    const io = req.io;
    if (io) {
      io.to(`user:${userId.toString()}`).emit("notification:read", {
        notificationId: id,
      });
    }

    res.status(200).json({
      success: true,
      data: { notification },
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking notification as read",
      error: error.message,
    });
  }
};

/**
 * Mark multiple notifications as read
 * Body: { notificationIds: ["id1", "id2"] }
 */
export const markMultipleAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid notificationIds",
      });
    }

    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        userId,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    // Emit real-time event
    const io = req.io;
    if (io) {
      io.to(`user:${userId.toString()}`).emit("notification:read-batch", {
        notificationIds,
        count: result.modifiedCount,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Error marking multiple notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking notifications as read",
      error: error.message,
    });
  }
};

/**
 * Mark notification as dismissed
 */
export const dismissNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      {
        dismissed: true,
        dismissedAt: new Date(),
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { notification },
    });
  } catch (error) {
    console.error("Error dismissing notification:", error);
    res.status(500).json({
      success: false,
      message: "Error dismissing notification",
      error: error.message,
    });
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting notification",
      error: error.message,
    });
  }
};

/**
 * Clear all notifications for a user (optional soft delete)
 */
export const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.deleteMany({ userId });

    res.status(200).json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error clearing notifications",
      error: error.message,
    });
  }
};

/**
 * Get critical notifications (for dashboard)
 */
export const getCriticalNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({
      userId,
      severity: { $in: ["critical", "high"] },
      read: false,
      dismissed: false,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: { notifications },
    });
  } catch (error) {
    console.error("Error fetching critical notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching critical notifications",
      error: error.message,
    });
  }
};

/**
 * Send broadcast notification to all users with role "user"
 * Body: { title, description, severity }
 */
export const sendBroadcastNotification = async (req, res) => {
  try {
    const { title, description, severity = "info" } = req.body;
    const io = req.io;

    // Validate input
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    // Get all users with role "user"
    const allUsers = await User.find({ role: "user" }).select("_id");

    if (allUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found",
      });
    }

    // Create notification for each user and emit via Socket.io
    const notifications = [];
    const notificationPromises = allUsers.map(async (user) => {
      const notification = await Notification.create({
        userId: user._id,
        type: "INFO",
        severity,
        title,
        message: description,
        description,
        action: "NONE",
      });
      notifications.push(notification);

      // Emit real-time notification via Socket.io
      if (io) {
        io.to(`user:${user._id.toString()}`).emit("notification:new", {
          _id: notification._id,
          type: notification.type,
          severity: notification.severity,
          title: notification.title,
          message: notification.message,
          description: notification.description,
          createdAt: notification.createdAt,
          read: notification.read,
        });
      }
    });

    await Promise.all(notificationPromises);

    console.log(
      `[Broadcast] 📢 Sent to ${allUsers.length} users`
    );

    res.status(201).json({
      success: true,
      data: {
        message: `Notification sent to ${allUsers.length} users`,
        sentCount: allUsers.length,
      },
    });
  } catch (error) {
    console.error("Error sending broadcast notification:", error);
    res.status(500).json({
      success: false,
      message: "Error sending broadcast notification",
      error: error.message,
    });
  }
};
