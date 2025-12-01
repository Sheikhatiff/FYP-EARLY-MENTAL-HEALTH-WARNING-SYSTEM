/**
 * NotificationScheduler Service
 * Manages scheduled notification jobs for digests and re-engagement messaging
 * 
 * Ensures the system proactively reaches out to users, transforming from 
 * "reactive alerts" to "proactive partnership"
 */

import Agenda from "../utils/agenda.js";
import User from "../models/user.model.js";
import UserEngagementState from "../models/userEngagementState.model.js";
import { createNotification } from "../controllers/notification.controller.js";
import { 
  generateDailyDigestInsight,
  generateWeeklyDigestInsight,
  generateReEngagementInsight,
  generateMilestoneInsight,
} from "../utils/insightGenerator.js";
import UserHistory from "../models/baseline_history.model.js";

/**
 * Schedule daily digest jobs for all active users
 * Jobs are scheduled at user's preferred time (default: 8 PM)
 */
export const scheduleDailyDigestJobs = () => {
  Agenda.define("send_daily_digest", async (job) => {
    try {
      const { userId } = job.attrs.data;
      console.log(`[NotificationScheduler] 📊 Processing daily digest for user: ${userId}`);

      const insight = await generateDailyDigestInsight(userId);
      if (!insight) {
        console.log(`[NotificationScheduler] ⏭️ Skipping digest for user ${userId}: no insight generated`);
        return;
      }

      // Create notification from insight
      const notification = await createNotification(
        {
          userId,
          type: "PATTERN_WARNING", // Using existing type
          severity: "info",
          title: insight.title,
          message: insight.message,
          description: insight.description,
          triggerData: {
            insightType: "daily_digest",
            metadata: insight.metadata,
          },
          action: "VIEW_JOURNAL",
        },
        Agenda.getIO?.()
      );

      // Update engagement state
      await UserEngagementState.findOneAndUpdate(
        { userId },
        {
          $set: {
            "notificationHistory.lastDigestSent": new Date(),
            needsDailyDigest: false,
          },
          $inc: {
            "notificationHistory.totalNotificationsSent": 1,
          },
        },
        { upsert: true }
      );

      console.log(`[Insight] 📧 Daily Digest compiled for user ${userId}`);
    } catch (error) {
      console.error(`[NotificationScheduler] ❌ Error in daily digest job for user ${job.attrs.data?.userId}:`, error);
    }
  });

  // Schedule daily digest for each user at their preferred time
  Agenda.define("schedule_daily_digests_for_users", async () => {
    try {
      console.log(`[NotificationScheduler] 🔄 Scheduling daily digests for all users...`);

      const activeUsers = await UserEngagementState.find({
        "preferences.enableDailyDigest": true,
      }).select("userId preferences");

      for (const engagement of activeUsers) {
        const time = engagement.preferences?.dailyDigestTime || "20:00";
        const [hours, minutes] = time.split(":").map(Number);

        // Schedule job to run at specific time
        Agenda.schedule(
          `in 1 day at ${hours}:${minutes}`,
          "send_daily_digest",
          {
            userId: engagement.userId,
          }
        );
      }

      console.log(`[NotificationScheduler] ✅ Scheduled daily digests for ${activeUsers.length} users`);
    } catch (error) {
      console.error(`[NotificationScheduler] ❌ Error scheduling daily digests:`, error);
    }
  });
};

/**
 * Schedule weekly digest jobs for all active users
 * Defaults to Sunday, but respects user preferences
 */
export const scheduleWeeklyDigestJobs = () => {
  Agenda.define("send_weekly_digest", async (job) => {
    try {
      const { userId } = job.attrs.data;
      console.log(`[NotificationScheduler] 📅 Processing weekly digest for user: ${userId}`);

      const insight = await generateWeeklyDigestInsight(userId);
      if (!insight) {
        console.log(`[NotificationScheduler] ⏭️ Skipping weekly digest for user ${userId}: no insight generated`);
        return;
      }

      // Create notification from insight
      const notification = await createNotification(
        {
          userId,
          type: "INFO",
          severity: "info",
          title: insight.title,
          message: insight.message,
          description: insight.description,
          triggerData: {
            insightType: "weekly_digest",
            metadata: insight.metadata,
          },
          action: "VIEW_JOURNAL",
        },
        Agenda.getIO?.()
      );

      // Update engagement state
      await UserEngagementState.findOneAndUpdate(
        { userId },
        {
          $set: {
            "notificationHistory.lastDigestSent": new Date(),
            needsWeeklyDigest: false,
          },
          $inc: {
            "notificationHistory.totalNotificationsSent": 1,
          },
        },
        { upsert: true }
      );

      console.log(`[Insight] 📧 Weekly Digest compiled for user ${userId}`);
    } catch (error) {
      console.error(`[NotificationScheduler] ❌ Error in weekly digest job for user ${job.attrs.data?.userId}:`, error);
    }
  });

  Agenda.define("schedule_weekly_digests_for_users", async () => {
    try {
      console.log(`[NotificationScheduler] 🔄 Scheduling weekly digests for all users...`);

      const activeUsers = await UserEngagementState.find({
        "preferences.enableWeeklyDigest": true,
      }).select("userId preferences");

      for (const engagement of activeUsers) {
        const dayName = engagement.preferences?.weeklyDigestDay || "Sunday";
        const dayMap = {
          Sunday: 0,
          Monday: 1,
          Tuesday: 2,
          Wednesday: 3,
          Thursday: 4,
          Friday: 5,
          Saturday: 6,
        };

        const targetDay = dayMap[dayName] || 0;
        const today = new Date();
        const daysUntilTarget = (targetDay + 7 - today.getDay()) % 7 || 7;

        const scheduleDate = new Date(today);
        scheduleDate.setDate(scheduleDate.getDate() + daysUntilTarget);
        scheduleDate.setHours(20, 0, 0, 0); // 8 PM

        Agenda.schedule(scheduleDate, "send_weekly_digest", {
          userId: engagement.userId,
        });
      }

      console.log(`[NotificationScheduler] ✅ Scheduled weekly digests for ${activeUsers.length} users`);
    } catch (error) {
      console.error(`[NotificationScheduler] ❌ Error scheduling weekly digests:`, error);
    }
  });
};

/**
 * Schedule re-engagement checks for inactive users
 * Triggered when user is inactive for configured threshold (default: 3 days)
 */
export const scheduleReEngagementJobs = () => {
  Agenda.define("send_re_engagement", async (job) => {
    try {
      const { userId } = job.attrs.data;
      console.log(`[NotificationScheduler] 🔄 Sending re-engagement message for user: ${userId}`);

      // Check if user is still inactive
      const engagement = await UserEngagementState.findOne({ userId });
      if (!engagement || engagement.isActive) {
        console.log(`[NotificationScheduler] ⏭️ User ${userId} is now active, skipping re-engagement`);
        return;
      }

      // Fetch last significant deviation
      const lastDeviation = engagement.lastSignificantDeviation;

      const insight = await generateReEngagementInsight(userId, lastDeviation);
      if (!insight) {
        console.log(`[NotificationScheduler] ⏭️ Skipping re-engagement for user ${userId}: no insight generated`);
        return;
      }

      // Create notification
      const notification = await createNotification(
        {
          userId,
          type: "INFO",
          severity: "info",
          title: insight.title,
          message: insight.message,
          description: insight.description,
          triggerData: {
            insightType: "re_engagement",
            context: lastDeviation,
          },
          action: "VIEW_JOURNAL",
        },
        Agenda.getIO?.()
      );

      // Update engagement state
      await UserEngagementState.findOneAndUpdate(
        { userId },
        {
          $set: {
            "notificationHistory.lastReEngagementSent": new Date(),
            reEngagementShownForCurrentInactivity: true,
          },
          $inc: {
            "notificationHistory.totalNotificationsSent": 1,
          },
        },
        { upsert: true }
      );

      console.log(`[Notification] ✅ Contextual re-engagement sent based on last significant deviation for user ${userId}`);
    } catch (error) {
      console.error(`[NotificationScheduler] ❌ Error in re-engagement job for user ${job.attrs.data?.userId}:`, error);
    }
  });

  // Check for inactive users every 6 hours
  Agenda.define("check_inactive_users_for_reengagement", async () => {
    try {
      console.log(`[NotificationScheduler] 🔍 Checking for inactive users needing re-engagement...`);

      const engagements = await UserEngagementState.find({
        "preferences.enableReEngagement": true,
        isActive: false,
        reEngagementShownForCurrentInactivity: false,
      }).select("userId preferences inactivityStartedAt");

      for (const engagement of engagements) {
        const thresholdMs =
          (engagement.preferences?.reEngagementThresholdDays || 3) * 24 * 60 * 60 * 1000;
        const timeSinceInactive = Date.now() - (engagement.inactivityStartedAt?.getTime() || 0);

        if (timeSinceInactive >= thresholdMs) {
          // Schedule re-engagement immediately
          Agenda.now("send_re_engagement", { userId: engagement.userId });
        }
      }

      console.log(`[NotificationScheduler] ✅ Re-engagement check completed`);
    } catch (error) {
      console.error(`[NotificationScheduler] ❌ Error checking for inactive users:`, error);
    }
  });
};

/**
 * Schedule milestone detection and notifications
 * Run daily to check for achievements
 */
export const scheduleMilestoneJobs = () => {
  Agenda.define("detect_and_notify_milestones", async (job) => {
    try {
      const { userId } = job.attrs.data;
      console.log(`[NotificationScheduler] 🎯 Checking for milestones for user: ${userId}`);

      const engagement = await UserEngagementState.findOne({ userId });
      if (!engagement) return;

      let milestone = null;

      // 7-day streak
      if (engagement.engagementMetrics.streakDays === 7) {
        milestone = "streak_7_days";
      }
      // 30-day streak
      else if (engagement.engagementMetrics.streakDays === 30) {
        milestone = "streak_30_days";
      }
      // Check for stability improvement
      else if (engagement.engagementMetrics.journalEntriesThisWeek >= 3) {
        // Could add more sophisticated milestone logic
        milestone = null;
      }

      if (milestone) {
        const insight = await generateMilestoneInsight(userId, milestone);
        if (insight) {
          await createNotification(
            {
              userId,
              type: "POSITIVE_MILESTONE",
              severity: "info",
              title: insight.title,
              message: insight.message,
              description: insight.description,
              triggerData: {
                milestone,
              },
            },
            Agenda.getIO?.()
          );

          console.log(`[Milestone] 🎉 ${milestone} achievement unlocked for user ${userId}`);
        }
      }
    } catch (error) {
      console.error(`[NotificationScheduler] ❌ Error detecting milestones for user ${job.attrs.data?.userId}:`, error);
    }
  });

  Agenda.define("daily_milestone_check", async () => {
    try {
      console.log(`[NotificationScheduler] 🎯 Daily milestone detection running...`);

      const allUsers = await User.find({}).select("_id");

      for (const user of allUsers) {
        Agenda.now("detect_and_notify_milestones", { userId: user._id });
      }
    } catch (error) {
      console.error(`[NotificationScheduler] ❌ Error in daily milestone check:`, error);
    }
  });
};

/**
 * Initialize all scheduler jobs and set up recurring triggers
 * Call this during app startup
 */
export const initializeNotificationScheduler = async () => {
  try {
    console.log(`[NotificationScheduler] 🚀 Initializing notification scheduler...`);

    // Define all job types
    scheduleDailyDigestJobs();
    scheduleWeeklyDigestJobs();
    scheduleReEngagementJobs();
    scheduleMilestoneJobs();

    // Set up recurring meta-jobs to schedule the actual jobs
    Agenda.every("1 hour", "schedule_daily_digests_for_users");
    Agenda.every("1 week", "schedule_weekly_digests_for_users");
    Agenda.every("6 hours", "check_inactive_users_for_reengagement");
    Agenda.every("1 day", "daily_milestone_check");

    console.log(`[NotificationScheduler] ✅ Notification scheduler initialized successfully`);
  } catch (error) {
    console.error(`[NotificationScheduler] ❌ Error initializing scheduler:`, error);
  }
};

/**
 * Update user engagement state
 * Called when user logs in or creates journal entry
 */
export const updateUserEngagement = async (userId, activityType = "login") => {
  try {
    const now = new Date();
    let updates = {};

    if (activityType === "login") {
      updates = {
        $set: {
          lastLogin: now,
          isActive: true,
          inactivityStartedAt: null,
          reEngagementShownForCurrentInactivity: false,
        },
        $inc: {
          totalLogins: 1,
        },
      };
    } else if (activityType === "journal_entry") {
      updates = {
        $set: {
          lastJournalEntry: now,
          isActive: true,
          inactivityStartedAt: null,
          reEngagementShownForCurrentInactivity: false,
        },
        $inc: {
          "engagementMetrics.journalEntriesThisWeek": 1,
          "engagementMetrics.streakDays": 1,
        },
      };
    }

    const engagement = await UserEngagementState.findOneAndUpdate(
      { userId },
      updates,
      { new: true, upsert: true }
    );

    return engagement;
  } catch (error) {
    console.error(`[NotificationScheduler] Error updating engagement for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Mark user as inactive after configured period
 * Called by scheduled job checking for inactivity
 */
export const markInactiveIfNeeded = async (userId, inactiveDaysThreshold = 1) => {
  try {
    const engagement = await UserEngagementState.findOne({ userId });
    if (!engagement) return;

    const daysSinceActivity = Math.floor(
      (Date.now() - (engagement.lastJournalEntry?.getTime() || Date.now())) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActivity >= inactiveDaysThreshold && engagement.isActive) {
      await UserEngagementState.findOneAndUpdate(
        { userId },
        {
          $set: {
            isActive: false,
            inactivityStartedAt: new Date(),
            consecutiveInactiveDays: daysSinceActivity,
          },
        }
      );

      console.log(`[NotificationScheduler] 💤 User ${userId} marked as inactive after ${daysSinceActivity} days`);
    }
  } catch (error) {
    console.error(`[NotificationScheduler] Error marking user inactive:`, error);
  }
};

/**
 * Record last significant deviation for re-engagement context
 * Called by deviation detector when alert is generated
 */
export const recordLastSignificantDeviation = async (userId, deviationType, severity, emotionalContext) => {
  try {
    await UserEngagementState.findOneAndUpdate(
      { userId },
      {
        lastSignificantDeviation: {
          deviationType,
          severity,
          timestamp: new Date(),
          emotionalContext,
        },
      },
      { upsert: true }
    );
  } catch (error) {
    console.error(`[NotificationScheduler] Error recording deviation:`, error);
  }
};

export default {
  initializeNotificationScheduler,
  updateUserEngagement,
  markInactiveIfNeeded,
  recordLastSignificantDeviation,
  scheduleDailyDigestJobs,
  scheduleWeeklyDigestJobs,
  scheduleReEngagementJobs,
  scheduleMilestoneJobs,
};
