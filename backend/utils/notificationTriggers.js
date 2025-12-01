import { createNotification } from "../controllers/notification.controller.js";
import { checkAlertCooldown, setCooldown } from "./cooldownManager.js";

/**
 * Severity mapping based on deviation score and emotion types
 */
export const determineSeverity = (deviationScore, alertType) => {
  if (alertType === "PERSISTENT_NEGATIVITY") {
    return deviationScore > 0.7 ? "critical" : "high";
  }
  if (alertType === "EMOTION_SPIKE") {
    return deviationScore > 0.6 ? "high" : "medium";
  }
  if (alertType === "PATTERN_WARNING") {
    return "medium";
  }
  return deviationScore > 0.8 ? "critical" : "high";
};

/**
 * Create deviation alert notification
 * Called when mental health metrics deviate significantly from baseline
 */
export const notifyDeviationAlert = async (
  userId,
  emotion,
  currentValue,
  baselineValue,
  deviationScore,
  percentageChange,
  io = null
) => {
  try {
    const severity =
      deviationScore > 0.7 ? "critical" : deviationScore > 0.5 ? "high" : "moderate";

    const percentChange = Math.round(percentageChange * 100);
    const direction = currentValue > baselineValue ? "increased" : "decreased";
    const directionalEmoji = direction === "increased" ? "⬆️" : "⬇️";

    let message = "";
    if (Math.abs(percentChange) > 100) {
      message = `Your ${emotion} level is significantly different from your baseline - it's more than doubled!`;
    } else if (Math.abs(percentChange) > 50) {
      message = `Your ${emotion} level has ${direction} notably - by about ${Math.abs(percentChange)}% from your baseline.`;
    } else {
      message = `I notice your ${emotion} level is ${direction} compared to your typical pattern.`;
    }

    await createNotification({
      userId,
      type: "DEVIATION_ALERT",
      severity,
      title: `${emotion} Level ${directionalEmoji}`,
      message,
      description: `This deviation from your baseline might indicate a shift in your emotional state. Reflect on what's changed.`,
      triggerData: {
        emotionType: emotion,
        deviationScore,
        baselineValue,
        currentValue,
        percentageChange: percentChange,
        alertReason: "Significant deviation from baseline",
      },
      action: "NONE",
    }, io);
  } catch (error) {
    console.error("[NotificationTriggers] ❌ Error creating deviation alert notification:", error);
  }
};

/**
 * Create emotion spike warning notification
 * Called when emotion shows sudden sharp increase
 */
export const notifyEmotionSpike = async (
  userId,
  emotion,
  spikeValue,
  previousValue,
  severity = "high",
  io = null
) => {
  try {
    const spikeAmount = Math.round((spikeValue - previousValue) * 100);
    const percentage = Math.round(((spikeValue - previousValue) / previousValue) * 100);

    let message = "";
    if (percentage > 100) {
      message = `I notice ${emotion} has sharply increased - it's now more than double what it was in your last entry.`;
    } else if (percentage > 50) {
      message = `${emotion} appears to have spiked significantly in your latest entry.`;
    } else {
      message = `There's a noticeable increase in ${emotion} compared to your previous entry.`;
    }

    await createNotification({
      userId,
      type: "SPIKE_WARNING",
      severity,
      title: `⚡ Sudden ${emotion} Increase`,
      message,
      description: `This sudden change is worth noticing. Take a moment to reflect on what triggered this shift.`,
      triggerData: {
        emotionType: emotion,
        currentValue: spikeValue,
        baselineValue: previousValue,
        percentageChange: percentage,
        alertReason: "Sudden emotion spike detected",
      },
      action: "CHECK_BASELINE",
    }, io);
  } catch (error) {
    console.error("[NotificationTriggers] ❌ Error creating emotion spike notification:", error);
  }
};

/**
 * Create persistent negativity alert
 * Called when negative emotions persist over multiple entries
 */
export const notifyPersistentNegativity = async (
  userId,
  negativeEmotions,
  consecutiveCount,
  severity = "critical",
  io = null
) => {
  try {
    // Create more specific message based on emotion types and count
    let emotionList = Object.keys(negativeEmotions).join(", ");
    let message = "";
    let description = "";

    if (consecutiveCount >= 5) {
      message = `I've noticed you've been experiencing challenging emotions for several entries in a row.`;
      description = `You've had ${consecutiveCount} entries with elevated ${emotionList}. This persistent pattern suggests you might benefit from additional support or coping strategies.`;
    } else if (consecutiveCount >= 4) {
      message = `Your recent entries show a pattern of elevated negative emotions.`;
      description = `Over the last ${consecutiveCount} entries, I've noticed ${emotionList} have been prominent. It might help to reach out to someone or try a coping strategy.`;
    } else if (consecutiveCount >= 3) {
      message = `I've noticed some challenging emotions appearing regularly in your recent entries.`;
      description = `Your last ${consecutiveCount} entries have shown increased ${emotionList}. Consider reaching out for support or reviewing your wellbeing strategies.`;
    }

    await createNotification({
      userId,
      type: "RISK_ALERT",
      severity,
      title: "⚠️ Persistent Negative Pattern",
      message,
      description,
      triggerData: {
        emotionType: emotionList,
        consecutiveCount,
        alertReason: "Persistent negativity pattern detected",
      },
      action: "TAKE_ACTION",
    }, io);
  } catch (error) {
    console.error(
      "[NotificationTriggers] ❌ Error creating persistent negativity notification:",
      error
    );
  }
};

/**
 * Create positive milestone notification
 * Called when user achieves positive changes
 */
export const notifyPositiveMilestone = async (
  userId,
  achievement,
  details,
  io = null
) => {
  try {
    await createNotification({
      userId,
      type: "POSITIVE_MILESTONE",
      severity: "info",
      title: `🎉 ${achievement}`,
      message: details.message,
      description: details.description,
      triggerData: {
        alertReason: achievement,
      },
      action: "NONE",
    }, io);
  } catch (error) {
    console.error("Error creating positive milestone notification:", error);
  }
};

/**
 * Create pattern warning notification
 * Called when unusual patterns are detected
 */
export const notifyPatternWarning = async (
  userId,
  pattern,
  details,
  severity = "high",
  io = null
) => {
  try {
    await createNotification({
      userId,
      type: "PATTERN_WARNING",
      severity,
      title: `Pattern Detected: ${pattern}`,
      message: details.message,
      description: details.description,
      triggerData: {
        alertReason: `Pattern detected: ${pattern}`,
        ...details.data,
      },
      action: "CHECK_BASELINE",
    }, io);
  } catch (error) {
    console.error("Error creating pattern warning notification:", error);
  }
};

/**
 * Create baseline update notification
 * Called when baseline is updated with new entry
 */
export const notifyBaselineUpdate = async (userId, entryCount, changes, io = null) => {
  try {
    await createNotification({
      userId,
      type: "BASELINE_UPDATE",
      severity: "info",
      title: "📊 Baseline Updated",
      message: `Your emotional baseline has been updated with your latest entry (#${entryCount}).`,
      description: changes,
      triggerData: {
        entryCount,
        alertReason: "Baseline updated",
      },
      action: "NONE",
    }, io);
  } catch (error) {
    console.error("Error creating baseline update notification:", error);
  }
};

/**
 * Create risk alert notification
 * Called for critical mental health warnings
 */
export const notifyRiskAlert = async (
  userId,
  riskType,
  message,
  description,
  actionRequired = true,
  io = null
) => {
  try {
    await createNotification({
      userId,
      type: "RISK_ALERT",
      severity: "critical",
      title: `🚨 Mental Health Alert: ${riskType}`,
      message,
      description,
      triggerData: {
        alertReason: riskType,
      },
      action: actionRequired ? "TAKE_ACTION" : "NONE",
      actionData: {
        suggestedActions: [
          "Review recent entries",
          "Consider reaching out to support",
          "Practice coping strategies",
        ],
      },
    }, io);
  } catch (error) {
    console.error("Error creating risk alert notification:", error);
  }
};

/**
 * Batch create notifications (for multiple issues in one entry)
 */
export const createBatchNotifications = async (notificationsArray) => {
  try {
    const promises = notificationsArray.map((notification) =>
      createNotification(notification)
    );
    await Promise.all(promises);
  } catch (error) {
    console.error("Error creating batch notifications:", error);
  }
};

/**
 * Smart notification routing - determines which notifications to send based on severity and user preferences
 */
export const shouldSendNotification = (severity, userPreferences = {}) => {
  const {
    criticalOnly = false,
    muteNotifications = false,
    quietHours = false,
  } = userPreferences;

  if (muteNotifications) return false;

  if (criticalOnly && !["critical", "high"].includes(severity)) {
    return false;
  }

  if (quietHours && !["critical"].includes(severity)) {
    return false;
  }

  return true;
};

/**
 * Update alert cooldown after creating a notification
 * Prevents duplicate notifications of the same type using intelligent bypass conditions
 * 
 * Now uses the CooldownManager which:
 * - Implements tiered cooldowns (CRITICAL vs INSIGHTFUL)
 * - Allows bypass on deterioration/escalation
 * - Tracks state for context-aware decisions
 */
export async function updateAlertCooldown(baselineDoc, alertType, UserBaseline, customCooldownMs = null) {
  try {
    // Use the new enhanced cooldown manager
    const result = await setCooldown(baselineDoc.userId, alertType, baselineDoc, customCooldownMs);

    if (result) {
      console.log(
        `[NotificationTriggers] ✅ Enhanced cooldown set: ${result.severity} alert "${alertType}" until ${result.cooldownUntil.toLocaleString()}`
      );
    }

    return result;
  } catch (error) {
    console.error(`[NotificationTriggers] ❌ Error updating alert cooldown:`, error);
  }
}
