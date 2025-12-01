import mongoose from "mongoose";

/**
 * UserEngagementState Schema
 * Tracks user activity, notification history, and engagement patterns
 * Enables context-aware re-engagement messaging and proactive outreach
 */
const UserEngagementStateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // Login tracking for re-engagement triggers
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    lastJournalEntry: {
      type: Date,
      default: null,
    },
    totalLogins: {
      type: Number,
      default: 0,
    },

    // Inactivity tracking
    isActive: {
      type: Boolean,
      default: true,
    },
    inactivityStartedAt: {
      type: Date,
      default: null,
    },
    consecutiveInactiveDays: {
      type: Number,
      default: 0,
    },

    // Last significant deviation context for re-engagement
    lastSignificantDeviation: {
      type: {
        deviationType: String, // "positive" or "negative"
        severity: String,
        timestamp: Date,
        message: String,
        emotionalContext: String,
      },
      default: null,
    },

    // Notification delivery tracking
    notificationHistory: {
      lastNotificationSent: {
        type: Date,
        default: null,
      },
      lastDigestSent: {
        type: Date,
        default: null,
      },
      lastReEngagementSent: {
        type: Date,
        default: null,
      },
      totalNotificationsSent: {
        type: Number,
        default: 0,
      },
      notificationReadRate: {
        type: Number,
        default: 0, // percentage 0-100
      },
    },

    // User preferences for outreach
    preferences: {
      enableDailyDigest: { type: Boolean, default: true },
      dailyDigestTime: { type: String, default: "20:00" }, // 8 PM
      enableWeeklyDigest: { type: Boolean, default: true },
      weeklyDigestDay: { type: String, default: "Sunday" },
      enableReEngagement: { type: Boolean, default: true },
      reEngagementThresholdDays: { type: Number, default: 3 }, // Trigger after 3 days inactive
    },

    // Engagement quality metrics
    engagementMetrics: {
      streakDays: { type: Number, default: 0 }, // Consecutive days of journal entries
      journalEntriesThisWeek: { type: Number, default: 0 },
      averageEntriesPerWeek: { type: Number, default: 0 },
      lastStreakBroken: Date, // When did the user's streak end?
    },

    // Flag to track if re-engagement message was shown for current inactivity period
    reEngagementShownForCurrentInactivity: {
      type: Boolean,
      default: false,
    },

    // Mark for scheduled digest jobs
    needsDailyDigest: { type: Boolean, default: false },
    needsWeeklyDigest: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for finding users needing daily digests
UserEngagementStateSchema.index({ needsDailyDigest: 1, "preferences.enableDailyDigest": 1 });

// Index for finding users needing weekly digests
UserEngagementStateSchema.index({ needsWeeklyDigest: 1, "preferences.enableWeeklyDigest": 1 });

// Index for finding inactive users for re-engagement
UserEngagementStateSchema.index({ isActive: 1, lastJournalEntry: 1 });

export default mongoose.model("UserEngagementState", UserEngagementStateSchema);
