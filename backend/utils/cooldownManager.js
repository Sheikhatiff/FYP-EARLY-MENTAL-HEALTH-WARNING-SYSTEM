/**
 * Enhanced Cooldown Management System
 * Replaces static cooldown logic with context-aware, intelligent bypassing
 * 
 * Key improvements:
 * - Severity-based cooldown tiers (CRITICAL vs INSIGHTFUL)
 * - Bypass conditions for escalation/deterioration
 * - State-aware decision making
 */

import AlertRule from "../models/alertRule.model.js";
import UserBaseline from "../models/baseline.model.js";
import UserHistory from "../models/baseline_history.model.js";

/**
 * Get cooldown configuration for an alert type
 */
export async function getAlertRuleConfig(alertType) {
  try {
    let rule = await AlertRule.findOne({ alertType, isActive: true });

    // Provide sensible defaults if rule doesn't exist yet
    if (!rule) {
      const defaults = {
        negative_spike: {
          severity: "CRITICAL",
          baseCooldownMs: 12 * 60 * 60 * 1000, // 12 hours
        },
        persistent_negativity: {
          severity: "CRITICAL",
          baseCooldownMs: 6 * 60 * 60 * 1000, // 6 hours
        },
        pattern_deviation: {
          severity: "INSIGHTFUL",
          baseCooldownMs: 3 * 24 * 60 * 60 * 1000, // 3 days
        },
        positive_spike: {
          severity: "CONTEXTUAL",
          baseCooldownMs: 0, // No cooldown for positive engagement
        },
        positive_pattern_shift: {
          severity: "INSIGHTFUL",
          baseCooldownMs: 7 * 24 * 60 * 60 * 1000, // 7 days
        },
      };

      return defaults[alertType] || {
        severity: "INSIGHTFUL",
        baseCooldownMs: 24 * 60 * 60 * 1000, // Default 24 hours
      };
    }

    return {
      severity: rule.severity,
      baseCooldownMs: rule.baseCooldownMs,
      bypassConditions: rule.bypassConditions,
      lifecycle: rule.lifecycle,
    };
  } catch (error) {
    console.error(`[CooldownManager] Error fetching alert rule for ${alertType}:`, error);
    return {
      severity: "INSIGHTFUL",
      baseCooldownMs: 24 * 60 * 60 * 1000,
    };
  }
}

/**
 * Check if cooldown period has elapsed
 */
export function isCooldownActive(cooldownUntilDate) {
  if (!cooldownUntilDate) return false;
  return new Date() < new Date(cooldownUntilDate);
}

/**
 * Analyze if current alert shows deterioration compared to last alert
 * Used to bypass cooldown when situation is worsening
 */
async function detectDeterioration(userId, currentAlert, lastAlertData) {
  try {
    // If no previous alert data, can't compare
    if (!lastAlertData) return false;

    // Get recent entries to analyze trend
    const recentEntries = await UserHistory.find({ userId })
      .sort({ timestamp: -1 })
      .limit(3);

    if (recentEntries.length < 2) return false;

    // Check if negative emotions are increasing despite alert
    const negativeGroups = ["depression", "anxiety", "stress"];
    const emotionGroups = {
      depression: ["sadness", "disappointment", "remorse"],
      anxiety: ["nervousness", "fear", "confusion", "embarrassment"],
      stress: ["grief", "annoyance", "anger"],
    };

    let currentNegativeScore = 0;
    let previousNegativeScore = 0;

    for (const group of negativeGroups) {
      for (const emotion of emotionGroups[group] || []) {
        currentNegativeScore += Number(recentEntries[0].emotions?.[emotion] || 0);
        previousNegativeScore += Number(recentEntries[1].emotions?.[emotion] || 0);
      }
    }

    // Deterioration if negative score increased by 20%+
    const deteriorationThreshold = 0.2;
    const change = (currentNegativeScore - previousNegativeScore) / (previousNegativeScore || 1);

    const isDeterioration = change > deteriorationThreshold;
    if (isDeterioration) {
      console.log(`[CooldownManager] 📉 Deterioration detected for user ${userId}: ${(change * 100).toFixed(1)}% increase`);
    }

    return isDeterioration;
  } catch (error) {
    console.error(`[CooldownManager] Error detecting deterioration:`, error);
    return false;
  }
}

/**
 * Check if current alert is escalated compared to last one
 * Bypass cooldown if severity has increased
 */
function detectEscalation(currentAlert, lastAlertData, escalationFactor = 1.5) {
  if (!lastAlertData) return false;

  const currentSeverity = currentAlert.severity || 0;
  const lastSeverity = lastAlertData.severity || 0;

  const isEscalation = currentSeverity >= lastSeverity * escalationFactor;

  if (isEscalation) {
    console.log(`[CooldownManager] 📈 Alert escalation detected: ${lastSeverity} → ${currentSeverity}`);
  }

  return isEscalation;
}

/**
 * Core function: Determine if notification should bypass cooldown
 */
export async function shouldBypassCooldown(
  userId,
  alertType,
  currentAlert,
  baselineDoc
) {
  try {
    const alertConfig = await getAlertRuleConfig(alertType);

    // CONTEXTUAL alerts never have cooldown
    if (alertConfig.severity === "CONTEXTUAL") {
      console.log(`[CooldownManager] ✅ CONTEXTUAL alert - no cooldown applies`);
      return true;
    }

    // Check bypass conditions if configured
    if (alertConfig.bypassConditions) {
      // Check for user action override (user recently sought help/took action)
      // This would be tracked in UserEngagementState
      // TODO: Implement user action tracking

      // Check for deterioration - always bypass if situation worsening
      const lastAlertData = baselineDoc?.alertCooldowns?.[alertType]?.lastAlertInfo;
      const hasDeterioration = await detectDeterioration(userId, currentAlert, lastAlertData);

      if (hasDeterioration) {
        console.log(`[CooldownManager] 🚨 Cooldown BYPASSED due to deterioration`);
        return true;
      }

      // Check for escalation
      const hasEscalation = detectEscalation(
        currentAlert,
        lastAlertData,
        alertConfig.bypassConditions.escalationFactor
      );

      if (hasEscalation) {
        console.log(`[CooldownManager] 🔥 Cooldown BYPASSED due to escalation`);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(`[CooldownManager] Error checking bypass conditions:`, error);
    return false; // Default to respecting cooldown on error
  }
}

/**
 * Main function: Check if alert should be suppressed due to cooldown
 * Returns: { shouldSuppress: boolean, reason: string }
 */
export async function checkAlertCooldown(
  userId,
  alertType,
  currentAlert,
  baselineDoc
) {
  try {
    // Get alert configuration
    const alertConfig = await getAlertRuleConfig(alertType);

    // Check if cooldown is active
    const lastCooldown = baselineDoc?.alertCooldowns?.[alertType]?.cooldownUntil;
    const cooldownActive = isCooldownActive(lastCooldown);

    if (!cooldownActive) {
      // No active cooldown
      return {
        shouldSuppress: false,
        reason: "No active cooldown",
        cooldownUntil: null,
      };
    }

    // Cooldown is active - check if we should bypass it
    const shouldBypass = await shouldBypassCooldown(
      userId,
      alertType,
      currentAlert,
      baselineDoc
    );

    if (shouldBypass) {
      return {
        shouldSuppress: false,
        reason: "Cooldown bypassed due to bypass conditions",
        cooldownUntil: null,
      };
    }

    // Cooldown applies
    const timeRemaining = Math.ceil(
      (new Date(lastCooldown) - new Date()) / (1000 * 60)
    );

    return {
      shouldSuppress: true,
      reason: `Cooldown active (${timeRemaining} minutes remaining)`,
      cooldownUntil: lastCooldown,
      timeRemaining,
    };
  } catch (error) {
    console.error(`[CooldownManager] Error checking cooldown:`, error);
    // On error, be conservative and allow the alert through
    return {
      shouldSuppress: false,
      reason: "Error checking cooldown - alert allowed",
    };
  }
}

/**
 * Set cooldown for an alert type
 * Returns the cooldown configuration that was set
 */
export async function setCooldown(userId, alertType, baselineDoc, customCooldownMs = null) {
  try {
    const alertConfig = await getAlertRuleConfig(alertType);

    // Don't set cooldown for CONTEXTUAL alerts
    if (alertConfig.severity === "CONTEXTUAL") {
      console.log(`[CooldownManager] ℹ️ CONTEXTUAL alert - no cooldown set`);
      return null;
    }

    const cooldownMs = customCooldownMs || alertConfig.baseCooldownMs;
    const now = new Date();
    const cooldownUntil = new Date(now.getTime() + cooldownMs);

    // Initialize alertCooldowns if needed
    if (!baselineDoc.alertCooldowns) {
      baselineDoc.alertCooldowns = {};
    }

    // Store cooldown with additional metadata
    baselineDoc.alertCooldowns[alertType] = {
      cooldownUntil,
      lastNotificationAt: now,
      severity: alertConfig.severity,
      cooldownDurationMs: cooldownMs,
      // Could add more metadata here for analytics
    };

    await baselineDoc.save();

    const durationHours = (cooldownMs / (1000 * 60 * 60)).toFixed(1);
    console.log(
      `[CooldownManager] ⏱️ ${alertConfig.severity} cooldown set for "${alertType}" (${durationHours} hours)`
    );

    return {
      alertType,
      severity: alertConfig.severity,
      cooldownUntil,
      durationMs: cooldownMs,
    };
  } catch (error) {
    console.error(`[CooldownManager] Error setting cooldown:`, error);
  }
}

/**
 * Reset cooldown for an alert type (used when user explicitly takes action)
 */
export async function resetCooldown(userId, alertType, baselineDoc) {
  try {
    if (baselineDoc.alertCooldowns?.[alertType]) {
      delete baselineDoc.alertCooldowns[alertType];
      await baselineDoc.save();
      console.log(`[CooldownManager] 🔄 Cooldown reset for "${alertType}"`);
    }
  } catch (error) {
    console.error(`[CooldownManager] Error resetting cooldown:`, error);
  }
}

/**
 * Get all active cooldowns for a user
 */
export async function getActiveCooldowns(baselineDoc) {
  if (!baselineDoc.alertCooldowns) return [];

  const active = [];
  const now = new Date();

  for (const [alertType, cooldownData] of Object.entries(baselineDoc.alertCooldowns)) {
    if (new Date(cooldownData.cooldownUntil) > now) {
      active.push({
        alertType,
        ...cooldownData,
      });
    }
  }

  return active;
}

export default {
  getAlertRuleConfig,
  isCooldownActive,
  checkAlertCooldown,
  setCooldown,
  resetCooldown,
  getActiveCooldowns,
  shouldBypassCooldown,
};
