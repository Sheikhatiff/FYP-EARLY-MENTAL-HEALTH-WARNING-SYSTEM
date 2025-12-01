import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["DEVIATION_ALERT", "SPIKE_WARNING", "POSITIVE_MILESTONE", "RISK_ALERT", "PATTERN_WARNING", "BASELINE_UPDATE", "INFO"],
      required: true,
    },
    severity: {
      type: String,
      enum: ["critical", "high", "medium", "low", "info"],
      default: "info",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    description: String,
    
    // Metadata related to the trigger
    triggerData: {
      emotionType: String,
      deviationScore: Number,
      baselineValue: Number,
      currentValue: Number,
      percentageChange: Number,
      alertReason: String,
    },
    
    // Reference to related journal entry if applicable
    journalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journal",
    },
    
    // Action data
    action: {
      type: String,
      enum: ["NONE", "VIEW_JOURNAL", "CHECK_BASELINE", "TAKE_ACTION"],
      default: "NONE",
    },
    actionData: mongoose.Schema.Types.Mixed,
    
    // Status tracking
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    
    // Delivery status
    dismissed: {
      type: Boolean,
      default: false,
    },
    dismissedAt: Date,
    
    // Preferences and settings
    notificationPreferences: {
      sound: { type: Boolean, default: true },
      vibration: { type: Boolean, default: true },
      showInCenter: { type: Boolean, default: true },
    },
    
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete expired notifications (TTL index)
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for quick retrieval of unread notifications
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

// Index for counting unread
NotificationSchema.index({ userId: 1, read: 1 });

export default mongoose.model("Notification", NotificationSchema);
