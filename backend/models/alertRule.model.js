import mongoose from "mongoose";

/**
 * AlertRule Schema
 * Defines alert configurations with tiered severity and dynamic cooldowns
 * 
 * Replaces static cooldown logic with context-aware, stateful alerting
 */
const AlertRuleSchema = new mongoose.Schema(
  {
    alertType: {
      type: String,
      required: true,
      enum: [
        "negative_spike",
        "positive_spike",
        "persistent_negativity",
        "pattern_deviation",
        "positive_pattern_shift",
        "consistency_alert",
        "breakthrough_moment",
        "decline_acceleration"
      ],
      index: true,
    },

    // Severity tier: CRITICAL triggers often, INSIGHTFUL triggers less frequently
    severity: {
      type: String,
      required: true,
      enum: ["CRITICAL", "INSIGHTFUL", "CONTEXTUAL"],
      default: "INSIGHTFUL",
    },

    // Base cooldown period in milliseconds
    // CRITICAL: 6-12 hours (allow more frequent alerts for serious issues)
    // INSIGHTFUL: 3-7 days (patterns don't need daily notifications)
    // CONTEXTUAL: No cooldown (proactive messages, not alerts)
    baseCooldownMs: {
      type: Number,
      required: true,
      default: 24 * 60 * 60 * 1000, // 24 hours default
    },

    // Conditions that bypass the cooldown (reset or ignore it)
    bypassConditions: {
      // Bypass if next deviation is MORE severe than last
      escalationFactor: { type: Number, default: 1.5 }, // 50% more severe

      // Bypass if user shows signs of deterioration despite recent notification
      deteriorationSignals: {
        type: [String],
        default: ["consecutive_negative_entries", "declining_trend", "new_crisis_indicator"],
      },

      // For INSIGHTFUL alerts: bypass if user has shown significant improvement
      positiveOverrideThreshold: { type: Number, default: 0.4 }, // 40% improvement

      // Don't bypass if user just acted positively (e.g., sought help, took action)
      userActionWindowMs: { type: Number, default: 6 * 60 * 60 * 1000 }, // 6 hours
    },

    // Alert lifecycle configuration
    lifecycle: {
      // Auto-escalate after N repeated cooldowns without change
      escalateAfterRepeat: { type: Number, default: 3 },

      // Demote alert if user shows improvement
      demoteIfImproving: { type: Boolean, default: true },

      // Keep alert visible for this duration (fade/archive after)
      visibilityDurationMs: { type: Number, default: 30 * 24 * 60 * 60 * 1000 }, // 30 days
    },

    // Metadata for templating and personalization
    messageTemplate: String,
    descriptionTemplate: String,
    actionRecommendations: [String],
    emotionGroups: [String],

    // System metadata
    isActive: { type: Boolean, default: true },
    notes: String,
  },
  { timestamps: true }
);

// Index for quick lookups by alert type
AlertRuleSchema.index({ alertType: 1, isActive: 1 });

export default mongoose.model("AlertRule", AlertRuleSchema);
