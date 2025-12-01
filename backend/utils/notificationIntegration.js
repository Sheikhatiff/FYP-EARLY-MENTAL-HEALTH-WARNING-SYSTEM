/**
 * Notification Integration with Deviation Detection
 * This module integrates notification triggers with the mental health analysis system
 */

import {
  notifyDeviationAlert,
  notifyEmotionSpike,
  notifyPersistentNegativity,
  notifyPositiveMilestone,
  notifyPatternWarning,
  notifyBaselineUpdate,
  notifyRiskAlert,
  determineSeverity,
  shouldSendNotification,
  updateAlertCooldown,
} from "./notificationTriggers.js";

/**
 * Process alerts and create appropriate notifications
 * Called after deviation detection
 */
export const processNotificationsFromAlerts = async (
  userId,
  alerts,
  emotionData,
  baselineData,
  io = null,
  baselineDoc = null,
  UserBaseline = null
) => {
  try {
    if (!alerts || alerts.length === 0) {
      console.log(`[NotificationIntegration] 📭 No alerts to process for user ${userId}`);
      return;
    }

    console.log(`[NotificationIntegration] 🎯 Processing ${alerts.length} alert(s) for user ${userId}`);
    console.log(`[NotificationIntegration] 🔌 Socket.io instance: ${io ? "✅ Available" : "❌ Not available"}`);

    const notifications = [];

    for (const alert of alerts) {
      if (!alert) continue;

      switch (alert.type) {
        case "deviation":
          // Map emotion with highest deviation
          const maxDeviation = Object.entries(
            emotionData || {}
          ).reduce((prev, [emotion, value]) => {
            const baselineValue = (baselineData && baselineData[emotion]) || 0;
            const deviation = Math.abs(value - baselineValue);
            return deviation > prev.deviation
              ? { emotion, deviation, value, baselineValue }
              : prev;
          }, { emotion: "emotion", deviation: 0, value: 0, baselineValue: 0 });

          if (maxDeviation.deviation > 0.3) {
            await notifyDeviationAlert(
              userId,
              maxDeviation.emotion,
              maxDeviation.value,
              maxDeviation.baselineValue,
              alert.severity === "high" ? 0.7 : 0.5,
              (maxDeviation.value - maxDeviation.baselineValue) /
                (maxDeviation.baselineValue || 1),
              io
            );
          }
          break;

        case "spike":
          // Emotion spike warning
          if (alert.emotion && alert.value) {
            await notifyEmotionSpike(
              userId,
              alert.emotion,
              alert.value,
              alert.previousValue || 0,
              determineSeverity(0.6, "EMOTION_SPIKE"),
              io
            );
          }
          break;

        case "persistent_negativity":
          // Persistent negative emotions
          await notifyPersistentNegativity(
            userId,
            alert.emotions || {},
            alert.consecutiveCount || 3,
            alert.severity === "high" ? "critical" : "high",
            io
          );
          break;

        case "pattern_deviation":
          // Unusual pattern detected
          await notifyPatternWarning(
            userId,
            alert.pattern || "Unusual Pattern",
            {
              message: alert.message || "An unusual emotional pattern detected",
              description:
                alert.description ||
                "This pattern differs from your normal baseline",
              data: {
                drivingEmotions: alert.drivingEmotions || [],
                intensity: alert.intensity || "moderate",
              },
            },
            determineSeverity(alert.intensity === "high" ? 0.6 : 0.4, "PATTERN_WARNING"),
            io
          );
          break;

        default:
          // Generic risk alert for unmapped types
          if (alert.severity === "high" || alert.severity === "critical") {
            await notifyRiskAlert(
              userId,
              alert.type || "Health Alert",
              alert.message || "Mental health alert detected",
              alert.recommendation || "Please review your recent entries",
              true,
              io
            );
          }
      }
    }
    
    // Set cooldown for processed alerts to prevent duplicates
    if (baselineDoc && UserBaseline && alerts.length > 0) {
      for (const alert of alerts) {
        await updateAlertCooldown(baselineDoc, alert.type, UserBaseline);
      }
    }
    
    console.log(`[NotificationIntegration] ✅ Finished processing alerts for user ${userId}`);
  } catch (error) {
    console.error("[NotificationIntegration] ❌ Error processing notifications from alerts:", error);
  }
};

/**
 * Handle baseline update notifications
 * Called after baseline is updated with new entry
 */
export const notifyBaselineUpdated = async (userId, entryCount, changes, io = null) => {
  try {
    if (entryCount > 1) {
      // Only notify after first entry (on first, baseline is just initialized)
      const changeDescription =
        changes ||
        `Baseline updated with entry #${entryCount}. Your emotional baseline becomes more accurate with more data.`;
      await notifyBaselineUpdate(userId, entryCount, changeDescription, io);
    }
  } catch (error) {
    console.error("Error notifying baseline update:", error);
  }
};

/**
 * Handle positive achievements
 * Called when user reaches milestones or shows improvement
 */
export const notifyPositiveAchievement = async (
  userId,
  achievementType,
  details,
  io = null
) => {
  try {
    const achievements = {
      first_entry: {
        title: "🎉 First Journal Entry",
        message: "Great start! You've created your first journal entry.",
        description:
          "This is the beginning of tracking your emotional well-being. Keep going!",
      },
      tenth_entry: {
        title: "🎊 10 Entries Milestone",
        message: "Amazing! You've created 10 journal entries.",
        description:
          "Your baseline is becoming more accurate. Keep tracking for better insights.",
      },
      improved_mood: {
        title: "😊 Mood Improvement",
        message: "We've detected an improvement in your emotional patterns.",
        description:
          "Your recent entries show positive trends. Keep up the great work!",
      },
      reduced_negativity: {
        title: "✨ Reduced Negativity",
        message:
          "Great news! Negative emotions are decreasing compared to your baseline.",
        description:
          "Your well-being strategies seem to be working. Continue with what helps you.",
      },
      consistent_wellbeing: {
        title: "🌟 Consistent Well-Being",
        message: "You've maintained stable emotional health over the past week.",
        description:
          "Your dedication to tracking and self-awareness is paying off!",
      },
    };

    const achievement = achievements[achievementType] || {
      title: details?.title || "Achievement Unlocked",
      message: details?.message || "You've reached a milestone!",
      description: details?.description || "Keep up the great work!",
    };

    await notifyPositiveMilestone(userId, achievement.title, achievement, io);
  } catch (error) {
    console.error("Error notifying positive achievement:", error);
  }
};

/**
 * Send critical alert notification
 * Used for immediate alerts that need user attention
 */
export const sendCriticalAlert = async (userId, riskType, details, io = null) => {
  try {
    await notifyRiskAlert(
      userId,
      riskType,
      details.message,
      details.description,
      true,
      io
    );
  } catch (error) {
    console.error("Error sending critical alert:", error);
  }
};

/**
 * Check and notify user about recommendations
 */
export const notifyRecommendations = async (
  userId,
  recommendations,
  severity = "info"
) => {
  try {
    if (!recommendations || recommendations.length === 0) return;

    // For now, log recommendations as INFO notifications
    // In future, can create dedicated recommendation notifications
    console.log(`Recommendations for ${userId}:`, recommendations);
  } catch (error) {
    console.error("Error processing recommendations:", error);
  }
};
