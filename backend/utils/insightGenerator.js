/**
 * InsightGenerator Module
 * Translates raw mental health data into empathetic, narrative insights
 * Used for daily/weekly digests and re-engagement messaging
 * 
 * Philosophy: The system speaks to the user as a caring companion, not a sterile monitor
 */

import User from "../models/user.model.js";
import UserHistory from "../models/baseline_history.model.js";
import UserBaseline from "../models/baseline.model.js";

/**
 * Emotional group definitions for analysis
 */
const emotionGroups = {
  depression: ["sadness", "disappointment", "remorse"],
  anxiety: ["nervousness", "fear", "confusion", "embarrassment", "disapproval"],
  stress: ["grief", "annoyance", "anger"],
  positive: [
    "love", "desire", "joy", "admiration", "gratitude", "pride",
    "relief", "excitement", "amusement", "optimism", "caring", "approval"
  ],
  others: ["neutral", "realization", "surprise", "curiosity", "disgust"]
};

/**
 * Calculate aggregate emotion scores for a group
 */
function calculateGroupScore(emotionData, group) {
  const emotions = emotionGroups[group] || [];
  if (!emotions.length) return 0;
  
  const sum = emotions.reduce((acc, emotion) => {
    return acc + (Number(emotionData[emotion]) || 0);
  }, 0);
  
  return sum / emotions.length;
}

/**
 * Compare two emotion snapshots and identify changes
 */
function analyzeEmotionalChange(current, previous) {
  const changes = {};
  const groupKeys = Object.keys(emotionGroups);

  for (const group of groupKeys) {
    const currentScore = calculateGroupScore(current, group);
    const previousScore = calculateGroupScore(previous, group);
    const change = currentScore - previousScore;
    const percentChange = previousScore > 0 ? (change / previousScore) * 100 : 0;

    changes[group] = {
      current: +(currentScore.toFixed(3)),
      previous: +(previousScore.toFixed(3)),
      change: +(change.toFixed(3)),
      percentChange: +(percentChange.toFixed(1)),
      direction: change > 0.01 ? "up" : change < -0.01 ? "down" : "stable",
    };
  }

  return changes;
}

/**
 * Identify dominant emotional themes in recent entries
 */
async function identifyDominantThemes(userId, lookbackDays = 7) {
  const cutoffDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

  const entries = await UserHistory.find({
    userId,
    timestamp: { $gte: cutoffDate },
  }).sort({ timestamp: -1 });

  if (entries.length === 0) return null;

  const themeScores = {};

  for (const entry of entries) {
    for (const group of Object.keys(emotionGroups)) {
      const score = calculateGroupScore(entry.emotions || {}, group);
      themeScores[group] = (themeScores[group] || 0) + score;
    }
  }

  // Average and sort
  for (const group in themeScores) {
    themeScores[group] /= entries.length;
  }

  return Object.entries(themeScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([group, score]) => ({ group, score: +(score.toFixed(3)) }));
}

/**
 * Calculate week-over-week stability improvement
 */
async function calculateStabilityTrend(userId, weeks = 2) {
  const histories = [];

  for (let w = 0; w < weeks; w++) {
    const weekStart = new Date(Date.now() - (w + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(Date.now() - w * 7 * 24 * 60 * 60 * 1000);

    const entries = await UserHistory.find({
      userId,
      timestamp: { $gte: weekStart, $lt: weekEnd },
    });

    if (entries.length > 0) {
      // Calculate variability (lower = more stable)
      let variability = 0;
      for (let i = 1; i < entries.length; i++) {
        const current = calculateGroupScore(entries[i].emotions || {}, "positive");
        const previous = calculateGroupScore(entries[i - 1].emotions || {}, "positive");
        variability += Math.abs(current - previous);
      }
      variability /= Math.max(entries.length - 1, 1);

      histories.push({
        week: w,
        variability,
        entryCount: entries.length,
        avgPositive: calculateGroupScore(
          entries.reduce((acc, e) => {
            for (const [k, v] of Object.entries(e.emotions || {})) {
              acc[k] = (acc[k] || 0) + v;
            }
            return acc;
          }, {}),
          "positive"
        ) / entries.length,
      });
    }
  }

  if (histories.length < 2) return null;

  const current = histories[0];
  const previous = histories[1];

  return {
    currentWeekVariability: +(current.variability.toFixed(3)),
    previousWeekVariability: +(previous.variability.toFixed(3)),
    stabilityImprovement: +(
      ((previous.variability - current.variability) / previous.variability) *
      100
    ).toFixed(1),
    trend: current.variability < previous.variability ? "improving" : current.variability > previous.variability ? "declining" : "stable",
  };
}

/**
 * Generate a daily digest insight
 * Called by scheduler daily at user's preferred time
 */
export async function generateDailyDigestInsight(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log(`[InsightGenerator] User ${userId} not found for daily digest`);
      return null;
    }

    // Fetch recent data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEntries = await UserHistory.find({
      userId,
      timestamp: { $gte: today },
    });

    const recentEntries = await UserHistory.find({ userId })
      .sort({ timestamp: -1 })
      .limit(7);

    if (recentEntries.length === 0) {
      return {
        type: "daily_digest",
        title: "📖 Welcome Back",
        message: `Hi ${user.name}! We noticed you haven't journaled recently. Your daily reflection would help us understand your emotional journey better.`,
        description: "No entries today. Consider taking a moment to journal about how you're feeling.",
        insight: null,
      };
    }

    // Analyze current data
    const currentEntry = recentEntries[0];
    const baseline = await UserBaseline.findOne({ userId });
    const themes = await identifyDominantThemes(userId, 7);
    const stability = await calculateStabilityTrend(userId, 2);

    // Build narrative based on data
    let message = `📊 Here's your daily reflection, ${user.name}`;
    let description = "";
    let insights = [];

    // Check if user had an entry today
    if (todayEntries.length > 0) {
      const currentPositive = calculateGroupScore(currentEntry.emotions || {}, "positive");
      const baselinePositive = baseline ? calculateGroupScore(baseline.emotions || {}, "positive") : 0.5;
      const comparison = analyzeEmotionalChange(
        currentEntry.emotions || {},
        baseline?.emotions || {}
      );

      // Generate insights based on changes
      if (comparison.positive.change > 0.1) {
        insights.push(`✨ Your positive emotions are stronger today than your baseline (+${comparison.positive.percentChange.toFixed(0)}%)`);
      } else if (comparison.positive.change < -0.1) {
        insights.push(`💙 You're feeling a bit lower than usual. Remember, this is temporary and we're here for you (-${Math.abs(comparison.positive.percentChange).toFixed(0)}%)`);
      }

      // Anxiety/stress levels
      if (comparison.anxiety.change > 0.1) {
        insights.push(`⚠️ Anxiety levels are elevated. Consider taking a break or practicing a calming technique.`);
      }

      // Stability trend
      if (stability && stability.trend === "improving") {
        insights.push(`🌟 Great news! Your emotional stability is improving week over week (+${stability.stabilityImprovement.toFixed(0)}%)`);
      }
    }

    // Dominant themes
    if (themes && themes.length > 0) {
      const topThemes = themes.slice(0, 2).map(t => t.group).join(" and ");
      insights.push(`🎯 Your primary emotional themes this week have been: ${topThemes}`);
    }

    if (insights.length === 0) {
      insights.push(`💭 Your emotional state has been stable. Keep maintaining your current well-being routine.`);
    }

    description = insights.join("\n");
    message = insights[0] || message;

    return {
      type: "daily_digest",
      severity: "info",
      title: "📊 Daily Reflection",
      message,
      description,
      insights: insights.slice(1),
      metadata: {
        entriesCount: todayEntries.length,
        dominantThemes: themes,
        stability,
      },
    };
  } catch (error) {
    console.error(`[InsightGenerator] Error generating daily digest for user ${userId}:`, error);
    return null;
  }
}

/**
 * Generate a weekly digest insight
 * Called by scheduler weekly on user's preferred day
 */
export async function generateWeeklyDigestInsight(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log(`[InsightGenerator] User ${userId} not found for weekly digest`);
      return null;
    }

    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekEntries = await UserHistory.find({
      userId,
      timestamp: { $gte: weekStart },
    }).sort({ timestamp: -1 });

    if (weekEntries.length === 0) {
      return {
        type: "weekly_digest",
        title: "📅 Weekly Check-In",
        message: `Hi ${user.name}! It's been a quiet week. Your journal entries help us track your journey.`,
        description: "We haven't seen any entries this week. Starting fresh this week? We're here to listen.",
        insight: null,
      };
    }

    const stability = await calculateStabilityTrend(userId, 2);
    const themes = await identifyDominantThemes(userId, 7);
    const baseline = await UserBaseline.findOne({ userId });

    let insights = [];

    // Summary stats
    insights.push(`📝 You journaled ${weekEntries.length} time(s) this week`);

    // Stability trends
    if (stability) {
      if (stability.trend === "improving") {
        insights.push(`🎉 Your emotional stability improved by ${stability.stabilityImprovement.toFixed(0)}% compared to last week`);
      } else if (stability.trend === "declining") {
        insights.push(`⚠️ Your emotional patterns show more variability this week. Consider reaching out or taking self-care time.`);
      } else {
        insights.push(`➡️ Your emotional patterns remained consistent with last week`);
      }
    }

    // Dominant themes with context
    if (themes && themes.length > 0) {
      const emotionText = themes.map(t => t.group).join(", ");
      insights.push(`🎯 Primary emotional themes: ${emotionText}`);

      // Add supportive message based on themes
      if (themes.some(t => t.group === "positive") && themes[0].group === "positive") {
        insights.push(`💫 Keep nurturing those positive feelings. You're doing well!`);
      } else if (themes.some(t => ["anxiety", "stress", "depression"].includes(t.group))) {
        insights.push(`💚 We notice you're navigating some challenging emotions. Remember to reach out if you need support.`);
      }
    }

    const description = insights.join("\n");

    return {
      type: "weekly_digest",
      severity: "info",
      title: "📅 Weekly Summary",
      message: `${user.name}, here's your week in review`,
      description,
      insights: insights.slice(1),
      metadata: {
        entriesCount: weekEntries.length,
        dominantThemes: themes,
        stability,
      },
    };
  } catch (error) {
    console.error(`[InsightGenerator] Error generating weekly digest for user ${userId}:`, error);
    return null;
  }
}

/**
 * Generate re-engagement insight based on last significant deviation
 * Triggered when user logs in after inactivity or during scheduled re-engagement check
 */
export async function generateReEngagementInsight(userId, lastSignificantDeviation) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log(`[InsightGenerator] User ${userId} not found for re-engagement`);
      return null;
    }

    let message = "";
    let description = "";

    if (!lastSignificantDeviation) {
      // No recent context, use generic welcome-back
      message = `👋 Welcome back, ${user.name}!`;
      description = `We've been tracking your mental health journey. It's great to see you again! How have you been feeling lately?`;
    } else if (lastSignificantDeviation.deviationType === "negative") {
      // User was struggling
      message = `💙 Welcome back, ${user.name}`;
      description =
        `The last time you journaled, you were feeling ${lastSignificantDeviation.emotionalContext}. ` +
        `How are you doing today? We're here to support you through any challenges.`;
    } else {
      // User was doing well
      message = `🌟 Welcome back, ${user.name}!`;
      description =
        `We're glad to have you back! The last time you journaled, you were feeling ${lastSignificantDeviation.emotionalContext}. ` +
        `We hope you're still riding that wave of positivity. Tell us what's on your mind today.`;
    }

    return {
      type: "re_engagement",
      severity: "info",
      title: "👋 Welcome Back",
      message,
      description,
      action: "VIEW_JOURNAL",
      metadata: {
        lastDeviationContext: lastSignificantDeviation,
        purposefulness: "re-engagement",
      },
    };
  } catch (error) {
    console.error(`[InsightGenerator] Error generating re-engagement insight for user ${userId}:`, error);
    return null;
  }
}

/**
 * Generate milestone achievement insight
 * Celebrate user's progress and consistency
 */
export async function generateMilestoneInsight(userId, milestone) {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const milestoneMessages = {
      streak_7_days: {
        title: "🔥 Week on Fire!",
        message: `Amazing, ${user.name}!`,
        description: "You've journaled consistently for 7 days! Your dedication to self-awareness is truly commendable.",
        icon: "🔥",
      },
      streak_30_days: {
        title: "⭐ 30-Day Champion",
        message: `Incredible work, ${user.name}!`,
        description: "A full month of consistent journaling! You're building a powerful habit of emotional awareness.",
        icon: "⭐",
      },
      improved_baseline: {
        title: "📈 Improvement Detected",
        message: `Great news, ${user.name}!`,
        description: "Your recent emotional patterns show improvement compared to your baseline. Keep up the positive momentum!",
        icon: "📈",
      },
      stability_breakthrough: {
        title: "🌈 New Stability",
        message: `You've reached a breakthrough, ${user.name}!`,
        description: "Your emotional stability has significantly improved. This is a testament to your growth.",
        icon: "🌈",
      },
    };

    const config = milestoneMessages[milestone] || {
      title: "🎉 Achievement Unlocked",
      message: `Congratulations, ${user.name}!`,
      description: "You've reached a milestone in your mental health journey.",
      icon: "🎉",
    };

    return {
      type: "milestone",
      severity: "info",
      title: config.title,
      message: config.message,
      description: config.description,
      milestone,
    };
  } catch (error) {
    console.error(`[InsightGenerator] Error generating milestone insight for user ${userId}:`, error);
    return null;
  }
}

export default {
  generateDailyDigestInsight,
  generateWeeklyDigestInsight,
  generateReEngagementInsight,
  generateMilestoneInsight,
  analyzeEmotionalChange,
  identifyDominantThemes,
  calculateStabilityTrend,
  calculateGroupScore,
};
