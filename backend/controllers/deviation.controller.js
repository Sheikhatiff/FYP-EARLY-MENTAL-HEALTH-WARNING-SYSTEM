import { processNotificationsFromAlerts } from "../utils/notificationIntegration.js";
import { createNotification } from "./notification.controller.js";

export const COSINE_THRESHOLD = 0.25;
export const NEGATIVE_SPIKE_THRESHOLD = 0.15;
export const POSITIVE_SPIKE_THRESHOLD = 0.20; 
export const CONSECUTIVE_NEGATIVE_THRESHOLD = 3;
export const PERSISTENT_OCCURRENCE_THRESHOLD = 5;
export const ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const PROFESSIONAL_HELP_COOLDOWN_MS = 72 * 60 * 60 * 1000;
export const LOOKBACK_ENTRIES = 7;
export const MAX_EMOTION_KEYS = 40;
export const MIN_ENTRIES_FOR_BASELINE = 2;  // Start detection from 2nd entry 

export const SEVERITY_LEVELS = {
  INFO: "info",
  LOW: "low",
  MODERATE: "moderate",
  HIGH: "high",
  CRITICAL: "critical"
};

export const RECOMMENDATION_TYPES = {
  BREATHING: "breathing",
  MINDFULNESS: "mindfulness",
  EXERCISE: "exercise",
  SOCIAL: "social",
  CREATIVE: "creative",
  PROFESSIONAL: "professional",
  JOURNALING: "journaling",
  NATURE: "nature"
};

export const emotionGroups = {
  depression: ["sadness", "disappointment", "remorse"],
  anxiety: ["nervousness", "fear", "confusion", "embarrassment", "disapproval"],
  stress: ["grief", "annoyance", "anger"],
  positive: [
    "love", "desire", "joy", "admiration", "gratitude", "pride",
    "relief", "excitement", "amusement", "optimism", "caring", "approval"
  ],
  others: ["neutral", "realization", "surprise", "curiosity", "disgust"]
};


export function extractEmotionVector(prediction) {
  return Object.fromEntries(prediction);
}

export function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;
  const n = Math.max(a.length, b.length);
  const eps = 1e-12;

  const A = new Array(n).fill(0).map((_, i) => Number(a[i] || 0));
  const B = new Array(n).fill(0).map((_, i) => Number(b[i] || 0));

  let dot = 0, normASq = 0, normBSq = 0;
  for (let i = 0; i < n; i++) {
    dot += A[i] * B[i];
    normASq += A[i] * A[i];
    normBSq += B[i] * B[i];
  }
  
  const normA = Math.sqrt(normASq);
  const normB = Math.sqrt(normBSq);

  if (normA < eps && normB < eps) return 1;
  if (normA < eps || normB < eps) return 0;

  const sim = dot / (normA * normB);
  return Math.max(-1, Math.min(1, sim));
}

export function buildUnionVectors(current, baseline) {
  const keys = [...new Set([...Object.keys(current || {}), ...Object.keys(baseline || {})])]
    .slice(0, MAX_EMOTION_KEYS)
    .sort();

  const toNumber = (v) => (typeof v === "number" ? v : v ? Number(v) || 0 : 0);
  const currVec = keys.map((k) => toNumber(current[k]));
  const baseVec = keys.map((k) => toNumber(baseline[k]));

  return { keys, currVec, baseVec };
}


export async function detectPatternDeviation(similarity, deviationScore, groupIncreases = {}, userContext = {}) {
  if (deviationScore <= COSINE_THRESHOLD) {
    return { triggered: false };
  }

  const sorted = Object.entries(groupIncreases || {})
    .sort((a, b) => b[1] - a[1])
    .map(([g, v]) => ({ group: g, increase: +v.toFixed(4) }))
    .filter(x => x.increase > 0);

  const negativeGroupNames = new Set(["depression", "anxiety", "stress"]);
  const hasNegativeDriver = sorted.some(s => negativeGroupNames.has(s.group));
  
  // Contextual severity assessment
  let severity;
  if (deviationScore < 0.35) severity = SEVERITY_LEVELS.LOW;
  else if (deviationScore < 0.5) severity = SEVERITY_LEVELS.MODERATE;
  else if (deviationScore < 0.7) severity = SEVERITY_LEVELS.HIGH;
  else severity = SEVERITY_LEVELS.CRITICAL;

  // Adjust severity based on context
  if (!hasNegativeDriver) {
    severity = SEVERITY_LEVELS.INFO;
  } else if (userContext.recentPositiveTrend) {
    // Downgrade if user has been improving
    severity = downgradeSeverity(severity);
  }

  const alert = {
    type: hasNegativeDriver ? "pattern_deviation" : "positive_pattern_shift",
    severity: severity,
    deviationScore: +deviationScore.toFixed(4),
    message: generateContextualMessage("pattern", { deviationScore, hasNegativeDriver, sorted }),
    groups: sorted,
    contextual: true
  };

  return { triggered: true, alert, drivingGroups: sorted.map(s => s.group) };
}

export function detectEmotionSpikes(current, baseline, userContext = {}) {
  const negativeSpikes = [];
  const positiveSpikes = [];
  const negativeGroupNames = new Set(["depression", "anxiety", "stress"]);

  for (const [group, groupEmotions] of Object.entries(emotionGroups)) {
    for (const emotion of groupEmotions) {
      const curr = Number(current[emotion] || 0);
      const base = Number(baseline[emotion] || 0);
      const inc = +(curr - base);

      const threshold = negativeGroupNames.has(group) 
        ? NEGATIVE_SPIKE_THRESHOLD 
        : POSITIVE_SPIKE_THRESHOLD;

      if (inc > threshold) {
        const entry = { group, emotion, increase: +inc.toFixed(4) };
        if (negativeGroupNames.has(group)) negativeSpikes.push(entry);
        else positiveSpikes.push(entry);
      }
    }
  }

  const alerts = [];
  
  if (negativeSpikes.length > 0) {
    const severity = determineSpikesSeverity(negativeSpikes, userContext);
    alerts.push({
      type: "negative_spike",
      severity: severity,
      spikes: negativeSpikes,
      message: generateContextualMessage("negative_spike", { spikes: negativeSpikes, userContext })
    });
  }
  
  if (positiveSpikes.length > 0) {
    alerts.push({
      type: "positive_spike",
      severity: SEVERITY_LEVELS.INFO,
      spikes: positiveSpikes,
      message: generateContextualMessage("positive_spike", { spikes: positiveSpikes })
    });
  }

  return {
    triggered: alerts.length > 0,
    negativeSpikes,
    positiveSpikes,
    alerts,
    groups: [...new Set(negativeSpikes.map(s => s.group))]
  };
}

export async function detectPersistentNegativity(userId, UserHistory, userContext = {}) {
  const recent = await UserHistory.find({ userId })
    .sort({ timestamp: -1 })
    .limit(LOOKBACK_ENTRIES);

  if (recent.length < MIN_ENTRIES_FOR_BASELINE) {
    return { triggered: false };
  }

  // Calculate negative trend with more nuance
  const negativeEntries = recent.map(entry => {
    const neg = ["depression", "anxiety", "stress"]
      .flatMap((g) => emotionGroups[g] || [])
      .reduce((sum, e) => sum + (Number(entry.emotions?.[e] || 0)), 0);

    const pos = (emotionGroups["positive"] || []).reduce(
      (sum, e) => sum + (Number(entry.emotions?.[e] || 0)), 0
    );
    
    return { 
      isNegative: neg - pos > 0.05,
      negScore: neg,
      posScore: pos,
      ratio: pos > 0 ? neg / pos : neg
    };
  });

  const negDays = negativeEntries.filter(e => e.isNegative).length;
  const avgNegRatio = negativeEntries.reduce((sum, e) => sum + e.ratio, 0) / negativeEntries.length;

  if (negDays >= CONSECUTIVE_NEGATIVE_THRESHOLD) {
    const severity = determinePersistentSeverity(negDays, avgNegRatio, userContext);
    
    return {
      triggered: true,
      alert: {
        type: "persistent_negativity",
        severity: severity,
        days: negDays,
        avgRatio: +avgNegRatio.toFixed(2),
        message: generateContextualMessage("persistent", { negDays, avgNegRatio, total: LOOKBACK_ENTRIES })
      }
    };
  }
  
  return { triggered: false };
}


function determineSpikesSeverity(spikes, userContext = {}) {
  if (spikes.length >= 3) return SEVERITY_LEVELS.HIGH;
  if (spikes.length >= 2) return SEVERITY_LEVELS.MODERATE;
  if (userContext.vulnerableTime) return SEVERITY_LEVELS.MODERATE;
  return SEVERITY_LEVELS.LOW;
}

function determinePersistentSeverity(negDays, avgRatio, userContext = {}) {
  if (negDays >= 5 && avgRatio > 2) return SEVERITY_LEVELS.CRITICAL;
  if (negDays >= 4 || avgRatio > 1.5) return SEVERITY_LEVELS.HIGH;
  if (userContext.hasSupport) return SEVERITY_LEVELS.LOW;
  return SEVERITY_LEVELS.MODERATE;
}

function downgradeSeverity(severity) {
  const levels = Object.values(SEVERITY_LEVELS);
  const currentIndex = levels.indexOf(severity);
  return currentIndex > 0 ? levels[currentIndex - 1] : severity;
}

function generateContextualMessage(type, data) {
  const templates = {
    pattern: {
      negative: [
        "I notice your emotional landscape has shifted today",
        "Your feelings seem to be in a different place than usual",
        "There's been a noticeable change in your emotional patterns"
      ],
      positive: [
        "I'm seeing some positive shifts in your emotional patterns",
        "Your emotional landscape seems brighter today",
        "There's a wonderful shift towards more positive feelings"
      ]
    },
    negative_spike: [
      "Some challenging emotions came up strongly today",
      "I notice {{emotions}} are particularly intense right now",
      "It looks like you're experiencing heightened {{emotions}}"
    ],
    positive_spike: [
      "Wonderful to see such strong {{emotions}} today",
      "Your {{emotions}} are really shining through",
      "I'm noticing a beautiful surge in {{emotions}}"
    ],
    persistent: [
      "You've been navigating difficult waters for a while now",
      "I've noticed the challenging feelings have been staying around",
      "It seems like you've been carrying this weight for some time"
    ]
  };

  let message;
  switch(type) {
    case "pattern":
      const patternTemplates = data.hasNegativeDriver ? templates.pattern.negative : templates.pattern.positive;
      message = patternTemplates[Math.floor(Math.random() * patternTemplates.length)];
      break;
    case "negative_spike":
      const negEmotions = data.spikes.slice(0, 2).map(s => s.emotion).join(" and ");
      message = templates.negative_spike[Math.floor(Math.random() * templates.negative_spike.length)]
        .replace("{{emotions}}", negEmotions);
      break;
    case "positive_spike":
      const posEmotions = data.spikes.slice(0, 2).map(s => s.emotion).join(" and ");
      message = templates.positive_spike[Math.floor(Math.random() * templates.positive_spike.length)]
        .replace("{{emotions}}", posEmotions);
      break;
    case "persistent":
      message = templates.persistent[Math.floor(Math.random() * templates.persistent.length)];
      break;
    default:
      message = "I'm here to support you through this";
  }
  
  return message;
}


export async function generatePersonalizedRecommendations(alerts, userProfile, baselineDoc) {
  const recommendations = [];
  const now = Date.now();
  
  // Track recommendation history to avoid repetition
  const recentRecommendations = userProfile.recommendationHistory || [];
  const lastProfessionalSuggestion = baselineDoc.lastProfessionalHelpSuggestion;
  
  // Analyze alert severity distribution
  const severityCount = alerts.reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
    return acc;
  }, {});
  
  const hasHighSeverity = severityCount[SEVERITY_LEVELS.HIGH] > 0 || severityCount[SEVERITY_LEVELS.CRITICAL] > 0;
  const hasOnlyPositive = alerts.every(a => a.type === "positive_spike" || a.type === "positive_pattern_shift");
  
  // Generate recommendations based on patterns
  if (hasOnlyPositive) {
    recommendations.push({
      type: RECOMMENDATION_TYPES.JOURNALING,
      message: "Consider capturing these positive moments in a journal to revisit when needed",
      priority: "low"
    });
  } else if (hasHighSeverity) {
    // Check cooldown for professional help suggestion
    const canSuggestProfessional = !lastProfessionalSuggestion || 
      (now - new Date(lastProfessionalSuggestion).getTime() > PROFESSIONAL_HELP_COOLDOWN_MS);
    
    if (canSuggestProfessional && severityCount[SEVERITY_LEVELS.CRITICAL] > 0) {
      recommendations.push({
        type: RECOMMENDATION_TYPES.PROFESSIONAL,
        message: "When you're ready, talking to someone trained in mental health could provide valuable support",
        priority: "high"
      });
      // Update last suggestion time
      baselineDoc.lastProfessionalHelpSuggestion = new Date(now);
    } else {
      // Offer alternative high-severity recommendations
      recommendations.push(...getAlternativeRecommendations(alerts, recentRecommendations));
    }
  } else {
    // Moderate severity - varied self-help suggestions
    recommendations.push(...getSelfHelpRecommendations(alerts, userProfile, recentRecommendations));
  }
  
  return recommendations;
}

function getAlternativeRecommendations(alerts, recentHistory) {
  const alternatives = [
    {
      type: RECOMMENDATION_TYPES.BREATHING,
      message: "A few minutes of deep breathing might help ground you right now",
      conditions: ["anxiety", "stress"]
    },
    {
      type: RECOMMENDATION_TYPES.EXERCISE,
      message: "Some gentle movement or a walk could help shift your energy",
      conditions: ["depression", "stress"]
    },
    {
      type: RECOMMENDATION_TYPES.SOCIAL,
      message: "Reaching out to a friend or loved one might provide comfort",
      conditions: ["depression", "anxiety"]
    },
    {
      type: RECOMMENDATION_TYPES.CREATIVE,
      message: "Expressing yourself through art, music, or writing can be therapeutic",
      conditions: ["depression", "stress"]
    },
    {
      type: RECOMMENDATION_TYPES.NATURE,
      message: "Spending some time in nature, even just sitting by a window, can be soothing",
      conditions: ["anxiety", "stress"]
    }
  ];
  
  // Filter based on detected conditions and recent history
  const detectedGroups = new Set(alerts.flatMap(a => a.groups?.map(g => g.group) || []));
  const suitable = alternatives.filter(alt => 
    alt.conditions.some(c => detectedGroups.has(c)) &&
    !recentHistory.some(r => r.type === alt.type && 
      (Date.now() - new Date(r.timestamp).getTime() < 48 * 60 * 60 * 1000))
  );
  
  return suitable.slice(0, 2).map(s => ({
    type: s.type,
    message: s.message,
    priority: "medium"
  }));
}

function getSelfHelpRecommendations(alerts, userProfile, recentHistory) {
  const recommendations = [];
  const preferences = userProfile.preferences || {};
  
  // Base recommendations on user preferences and what hasn't been suggested recently
  const selfHelp = [
    {
      type: RECOMMENDATION_TYPES.MINDFULNESS,
      message: "A brief mindfulness exercise might help you reconnect with the present",
      weight: preferences.mindfulness || 0.5
    },
    {
      type: RECOMMENDATION_TYPES.JOURNALING,
      message: "Writing down your thoughts can help process what you're feeling",
      weight: preferences.journaling || 0.5
    },
    {
      type: RECOMMENDATION_TYPES.BREATHING,
      message: "Try the 4-7-8 breathing technique: inhale for 4, hold for 7, exhale for 8",
      weight: preferences.breathing || 0.5
    }
  ];
  
  // Sort by weight and filter recent
  const filtered = selfHelp
    .filter(s => !recentHistory.some(r => 
      r.type === s.type && 
      (Date.now() - new Date(r.timestamp).getTime() < 24 * 60 * 60 * 1000)
    ))
    .sort((a, b) => b.weight - a.weight);
  
  return filtered.slice(0, 1).map(f => ({
    type: f.type,
    message: f.message,
    priority: "low"
  }));
}


export async function updateBaselineCounters({
  baselineDoc,
  detectedGroups = [],
  now = Date.now(),
  UserBaseline,
  highSeverityAlert = false,
  recommendations = []
}) {
  baselineDoc.modelCounters = baselineDoc.modelCounters || {};
  baselineDoc.recommendationHistory = baselineDoc.recommendationHistory || [];
  
  const changed = [];

  const safeDate = (val) => {
    const d = new Date(val);
    return d instanceof Date && !isNaN(d) ? d : null;
  };

  for (const group of detectedGroups) {
    baselineDoc.modelCounters[group] = baselineDoc.modelCounters[group] || {
      occurrences: 0,
      consecutive: 0,
      lastAlertAt: null,
      cooldownUntil: null,
      escalationLevel: 0
    };

    const mc = baselineDoc.modelCounters[group];
    mc.occurrences = (mc.occurrences || 0) + 1;

    const RECENT_MS = 48 * 60 * 60 * 1000;
    if (mc.lastAlertAt && (now - new Date(mc.lastAlertAt).getTime()) <= RECENT_MS) {
      mc.consecutive = (mc.consecutive || 0) + 1;
      if (mc.consecutive >= 3) mc.escalationLevel = Math.min(3, mc.escalationLevel + 1);
    } else {
      mc.consecutive = 1;
      mc.escalationLevel = Math.max(0, mc.escalationLevel - 1);
    }

    mc.lastAlertAt = safeDate(now);

    if (highSeverityAlert) {
      const cooldownMultiplier = 1 + (mc.escalationLevel * 0.5);
      const cooldownUntil = now + (typeof ALERT_COOLDOWN_MS === "number" ? ALERT_COOLDOWN_MS : 0) * cooldownMultiplier;
      mc.cooldownUntil = safeDate(cooldownUntil);
    }

    changed.push({ 
      group, 
      occurrences: mc.occurrences, 
      consecutive: mc.consecutive,
      escalationLevel: mc.escalationLevel 
    });
  }

  // Track recommendations
  recommendations.forEach(rec => {
    baselineDoc.recommendationHistory.push({
      type: rec.type,
      timestamp: safeDate(now),
      priority: rec.priority
    });
  });
  
  // Keep only last 30 days
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  baselineDoc.recommendationHistory = baselineDoc.recommendationHistory
    .filter(r => safeDate(r.timestamp)?.getTime() > thirtyDaysAgo);

  baselineDoc.updatedAt = safeDate(now);

  await UserBaseline.updateOne(
    { _id: baselineDoc._id }, 
    { 
      $set: { 
        modelCounters: baselineDoc.modelCounters, 
        recommendationHistory: baselineDoc.recommendationHistory,
        lastProfessionalHelpSuggestion: baselineDoc.lastProfessionalHelpSuggestion,
        updatedAt: baselineDoc.updatedAt 
      } 
    }
  );

  return { baselineDoc, changed };
}
    

export function shouldSuppressAlert(baselineDoc, group, now = Date.now()) {
  const mc = baselineDoc.modelCounters?.[group];
  if (!mc) return false;
  
  // Check cooldown
  if (mc.cooldownUntil && new Date(mc.cooldownUntil).getTime() > now) {
    return true;
  }
  
  // Check escalation level - suppress if too many consecutive alerts
  if (mc.escalationLevel >= 3) {
    return true;
  }
  
  return false;
}

/**
 * Check if an alert type should be suppressed due to cooldown
 * Prevents duplicate notifications of the same type within cooldown period
 */
export function shouldSuppressAlertType(baselineDoc, alertType, now = Date.now()) {
  const alertCooldown = baselineDoc.alertCooldowns?.[alertType];
  if (!alertCooldown) return false;
  
  // If cooldown exists and hasn't expired, suppress the alert
  if (alertCooldown.cooldownUntil && new Date(alertCooldown.cooldownUntil).getTime() > now) {
    console.log(`[Deviation] 🔇 Alert type "${alertType}" is in cooldown until ${new Date(alertCooldown.cooldownUntil).toLocaleString()}`);
    return true;
  }
  
  return false;
}

/**
 * Update alert cooldown after creating a notification
 */
export async function updateAlertCooldown(baselineDoc, alertType, UserBaseline, cooldownMs = ALERT_COOLDOWN_MS) {
  const now = new Date();
  const cooldownUntil = new Date(now.getTime() + cooldownMs);
  
  if (!baselineDoc.alertCooldowns) {
    baselineDoc.alertCooldowns = {};
  }
  
  baselineDoc.alertCooldowns[alertType] = {
    cooldownUntil: cooldownUntil,
    lastNotificationAt: now
  };
  
  await baselineDoc.save();
  console.log(`[Deviation] ⏱️ Set cooldown for "${alertType}" until ${cooldownUntil.toLocaleString()}`);
}


export function composeTherapeuticResponse(alerts, recommendations, userContext = {}) {
  if (alerts.length === 0) {
    return {
      summary: "Your emotional patterns are stable and within your normal range.",
      alerts: [],
      recommendations: [{
        type: RECOMMENDATION_TYPES.JOURNALING,
        message: "Keep nurturing your well-being with activities that bring you joy",
        priority: "info"
      }],
      supportiveNote: "I'm here whenever you need to talk."
    };
  }
  
  // Group alerts by severity
  const criticalAlerts = alerts.filter(a => a.severity === SEVERITY_LEVELS.CRITICAL);
  const highAlerts = alerts.filter(a => a.severity === SEVERITY_LEVELS.HIGH);
  const moderateAlerts = alerts.filter(a => a.severity === SEVERITY_LEVELS.MODERATE);
  const positiveAlerts = alerts.filter(a => 
    a.type === "positive_spike" || a.type === "positive_pattern_shift"
  );
  
  // Craft summary based on alert composition
  let summary;
  if (criticalAlerts.length > 0) {
    summary = "I'm noticing some significant emotional challenges today. You don't have to face this alone.";
  } else if (highAlerts.length > 0) {
    summary = "Today seems to be bringing some intense feelings. Let's work through this together.";
  } else if (positiveAlerts.length > 0 && moderateAlerts.length === 0) {
    summary = "I'm seeing some wonderful positive shifts in how you're feeling!";
  } else {
    summary = "I've noticed some changes in your emotional patterns today.";
  }
  
  // Add supportive note
  let supportiveNote;
  if (userContext.timeOfDay === "evening") {
    supportiveNote = "Rest well tonight. Tomorrow is a fresh start.";
  } else if (userContext.timeOfDay === "morning") {
    supportiveNote = "Take things one step at a time today.";
  } else {
    supportiveNote = "Remember, it's okay to not be okay. I'm here for you.";
  }
  
  return {
    summary,
    alerts: alerts.map(a => ({
      ...a,
      message: a.message || a.therapeuticMessage
    })),
    recommendations,
    supportiveNote
  };
}



function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    if (hour < 21) return "evening";
    return "night";
}

function isVulnerableTime() {
    const hour = new Date().getHours();
    return hour < 6 || hour > 22; // Early morning or late night
}

async function checkRecentPositiveTrend(userId, UserHistory) {
  const recent = await UserHistory.find({ userId })
    .sort({ timestamp: -1 })
    .limit(3);
    
  if (recent.length < 3) return false;
  
  // Check if positive emotions have been increasing
  const positiveScores = recent.map(entry => {
    return (emotionGroups["positive"] || []).reduce(
      (sum, e) => sum + (Number(entry.emotions?.[e] || 0)), 0
    );
  });
  
  return positiveScores[0] > positiveScores[1] && positiveScores[1] > positiveScores[2];
}
export async function detectDeviation(userId, prediction, UserHistory, UserBaseline, userProfile = {}, io = null) {
  try {
    // Extract current emotional state
    const current = extractEmotionVector(prediction) || {};
    
    // Load baseline
    const baselineDoc = await UserBaseline.findOne({ userId });
    if (!baselineDoc || !baselineDoc.emotions) {
      return {
        status: "insufficient_data",
        message: "Still learning your patterns. Keep sharing your feelings."
      };
    }
    
    // Check if we have enough history
    const entryCount = await UserHistory.countDocuments({ userId });
    if (entryCount < MIN_ENTRIES_FOR_BASELINE) {
      return {
        status: "building_baseline",
        message: "I'm still getting to know your emotional patterns.",
        entriesNeeded: MIN_ENTRIES_FOR_BASELINE - entryCount
      };
    }
    
    const baseline = baselineDoc.emotions || {};
    
    // Build context for better detection
    const userContext = {
      timeOfDay: getTimeOfDay(),
      recentPositiveTrend: await checkRecentPositiveTrend(userId, UserHistory),
      vulnerableTime: isVulnerableTime(),
      hasSupport: userProfile.hasSupport || false
    };
    
    // Calculate similarity and deviation
    const { currVec, baseVec } = buildUnionVectors(current, baseline);
    const similarity = cosineSimilarity(currVec, baseVec);
    const deviationScore = 1 - similarity;

    // Calculate group-wise changes
    const groupIncreases = {};
    for (const [group, groupEmotions] of Object.entries(emotionGroups)) {
      let sumInc = 0;
      for (const e of groupEmotions) {
        sumInc += Math.max(0, (Number(current[e] || 0) - Number(baseline[e] || 0)));
      }
      groupIncreases[group] = +sumInc.toFixed(6);
    }

    // Run detection algorithms
    const alerts = [];
    const detectedAlerts = [];  // Track ALL detected alerts (including suppressed ones)
    const now = Date.now();
    
    const pattern = await detectPatternDeviation(similarity, deviationScore, groupIncreases, userContext);
    let detectedAnyAlert = false;  // Track if ANY alert was detected (before cooldown)
    
    if (pattern.triggered) {
      detectedAnyAlert = true;
      detectedAlerts.push(pattern.alert);
      if (!shouldSuppressAlertType(baselineDoc, pattern.alert.type, now)) {
        alerts.push(pattern.alert);
      } else {
        console.log(`[Deviation] 🔇 Pattern alert suppressed by cooldown`);
      }
    }

    const spikesRes = detectEmotionSpikes(current, baseline, userContext);
    if (spikesRes.triggered) {
      detectedAnyAlert = true;
      spikesRes.alerts.forEach(a => detectedAlerts.push(a));
      // Check if spike alerts are in cooldown
      if (!shouldSuppressAlertType(baselineDoc, "negative_spike", now)) {
        spikesRes.alerts.forEach(a => {
          if (a.type === "negative_spike" && !shouldSuppressAlertType(baselineDoc, "negative_spike", now)) {
            alerts.push(a);
          } else if (a.type === "positive_spike" && !shouldSuppressAlertType(baselineDoc, "positive_spike", now)) {
            alerts.push(a);
          } else if (a.type !== "negative_spike" && a.type !== "positive_spike") {
            alerts.push(a);
          }
        });
      } else {
        console.log(`[Deviation] 🔇 Spike alerts suppressed by cooldown`);
      }
    }

    const persistent = await detectPersistentNegativity(userId, UserHistory, userContext);
    if (persistent.triggered) {
      detectedAnyAlert = true;
      detectedAlerts.push(persistent.alert);
      if (!shouldSuppressAlertType(baselineDoc, "persistent_negativity", now)) {
        alerts.push(persistent.alert);
      } else {
        console.log(`[Deviation] 🔇 Persistent negativity alert suppressed by cooldown`);
      }
    }

    // Deduplicate alerts by type - keep only the highest severity for each type
    const deduplicatedAlerts = [];
    const alertsByType = {};
    
    for (const alert of alerts) {
      if (!alertsByType[alert.type]) {
        alertsByType[alert.type] = alert;
      } else {
        // Keep the one with higher severity
        const severityOrder = ["info", "low", "moderate", "high", "critical"];
        const currentSeverityIndex = severityOrder.indexOf(alertsByType[alert.type].severity);
        const newSeverityIndex = severityOrder.indexOf(alert.severity);
        if (newSeverityIndex > currentSeverityIndex) {
          alertsByType[alert.type] = alert;
        }
      }
    }
    
    // Convert back to array
    for (const alert of Object.values(alertsByType)) {
      deduplicatedAlerts.push(alert);
    }

    // Create notifications from alerts or send check-in notification
    if (deduplicatedAlerts.length > 0) {
      try {
        console.log(`[Deviation] 🔔 Creating ${deduplicatedAlerts.length} notification(s) from alerts (deduplicated from ${alerts.length}), io=${io ? "✅" : "❌"}`);
        await processNotificationsFromAlerts(userId, deduplicatedAlerts, current, baseline, io, baselineDoc, UserBaseline);
        console.log(`[Deviation] ✅ Notifications created successfully`);
      } catch (notifError) {
        console.error("[Deviation] ❌ Error creating notifications:", notifError);
      }
    } else if (detectedAnyAlert) {
      // Alerts were detected but ALL were suppressed by cooldown - send minimal check-in notification
      try {
        console.log(`[Deviation] 📭 All alerts were suppressed by cooldown, sending check-in notification instead`);
        
        await createNotification({
          userId,
          type: "INFO",
          severity: "info",
          title: "📊 Deviation Check-in",
          message: "I've analyzed your entry - keep taking care of yourself",
          description: "Your emotional patterns have shifted. Keep journaling, it helps me understand you better.",
          triggerData: {
            deviationScore: +deviationScore.toFixed(4),
            similarity: +similarity.toFixed(4),
            alertsSuppressedByCooldown: true
          },
          action: "VIEW_JOURNAL"
        }, io);
        
        console.log(`[Deviation] ✅ Check-in notification created for suppressed alerts`);
      } catch (checkInError) {
        console.error("[Deviation] ⚠️ Error creating check-in notification:", checkInError);
      }
    } else {
      console.log(`[Deviation] 📭 No alerts generated`);
    }

    // Determine which groups need tracking
    const detectedGroups = new Set();
    const negativeGroupNames = new Set(["depression", "anxiety", "stress"]);
    
    if (spikesRes.groups?.length) {
      spikesRes.groups.forEach(g => detectedGroups.add(g));
    }
    
    if (persistent.triggered) {
      negativeGroupNames.forEach(g => detectedGroups.add(g));
    }
    
    if (pattern.triggered && pattern.drivingGroups?.length) {
      pattern.drivingGroups.forEach(g => {
        if (negativeGroupNames.has(g)) detectedGroups.add(g);
      });
    }

    // Apply suppression logic
    const effectiveGroups = [...detectedGroups].filter(g => 
      !shouldSuppressAlert(baselineDoc, g, now)
    );

    // Generate personalized recommendations
    const recommendations = await generatePersonalizedRecommendations(
      alerts, 
      userProfile, 
      baselineDoc
    );

    // Update baseline counters
    if (effectiveGroups.length > 0) {
      const highSeverity = alerts.some(a => 
        a.severity === SEVERITY_LEVELS.HIGH || 
        a.severity === SEVERITY_LEVELS.CRITICAL
      );
      
      await updateBaselineCounters({
        baselineDoc,
        detectedGroups: effectiveGroups,
        now,
        UserBaseline,
        highSeverityAlert: highSeverity,
        recommendations
      });
    }

    // Compose final therapeutic response
    // Use detectedAlerts (all detected before cooldown) for display, but deduplicatedAlerts for notifications
    const response = composeTherapeuticResponse(detectedAlerts, recommendations, userContext);
    
    // Save analysis results
    baselineDoc.deviation = {
      status: "analyzed",
      timestamp: new Date(now),
      similarity: +similarity.toFixed(4),
      deviationScore: +deviationScore.toFixed(4),
      response
    };
    
    await baselineDoc.save();
    
    return baselineDoc.deviation;
    
  } catch (err) {
    console.error("detectDeviation error:", err);
    return {
      status: "error",
      message: "I couldn't complete the analysis, but I'm still here for you.",
      error: err.message
    };
  }
}
