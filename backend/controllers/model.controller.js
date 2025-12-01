export const COSINE_THRESHOLD = 0.25; // if deviationScore > this -> pattern_deviation
export const NEGATIVE_SPIKE_THRESHOLD = 0.15; // per-emotion absolute increase considered a spike
export const CONSECUTIVE_NEGATIVE_THRESHOLD = 3; // e.g., 3 of last 7 entries with neg > pos
export const PERSISTENT_OCCURRENCE_THRESHOLD = 5; // lifetime occurrences to escalate baseline
export const ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours cooldown for high severity alerts
export const LOOKBACK_ENTRIES = 7; // how many recent entries to consider
export const MAX_EMOTION_KEYS = 40; // safeguard

export const emotionGroups = {
  depression: ["sadness", "disappointment", "remorse"],
  anxiety: ["nervousness", "fear", "confusion", "embarrassment", "disapproval"],
  stress: ["grief", "annoyance", "anger"],
  positive: [
    "love",
    "desire",
    "joy",
    "admiration",
    "gratitude",
    "pride",
    "relief",
    "excitement",
    "amusement",
    "optimism",
    "caring",
    "approval",
  ],
  others: ["neutral", "realization", "surprise", "curiosity", "disgust"],
};

// --- Extract emotion dict from predictions ---
export function extractEmotionVector(prediction) {
  return Object.fromEntries(prediction);
}

// Cosine similarity (manual implementation)
export function cosineSimilarity(a, b) {
  // Ensure arrays and same length
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;
  const n = Math.max(a.length, b.length);
  const eps = 1e-12;

  // pad shorter with zeros
  const A = new Array(n).fill(0).map((_, i) => Number(a[i] || 0));
  const B = new Array(n).fill(0).map((_, i) => Number(b[i] || 0));

  let dot = 0;
  let normASq = 0;
  let normBSq = 0;
  for (let i = 0; i < n; i++) {
    dot += A[i] * B[i];
    normASq += A[i] * A[i];
    normBSq += B[i] * B[i];
  }
  const normA = Math.sqrt(normASq);
  const normB = Math.sqrt(normBSq);

  // if both vectors are (near) zero, treat as identical (similarity = 1)
  if (normA < eps && normB < eps) return 1;

  // if one vector is zero and the other is not, similarity ~ 0
  if (normA < eps || normB < eps) return 0;

  const sim = dot / (normA * normB);
  // clamp to [-1, 1] to avoid floating rounding issues
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

export async function detectPatternDeviation(similarity, deviationScore, groupIncreases = {}) {
  if (deviationScore <= COSINE_THRESHOLD) {
    return { triggered: false };
  }

  // determine top groups causing the difference
  const sorted = Object.entries(groupIncreases || {})
    .sort((a,b) => b[1] - a[1])
    .map(([g, v]) => ({ group: g, increase: +v.toFixed(4) }))
    .filter(x => x.increase > 0);

  // if the top cause is positive group(s), mark as informational rather than critical
  const topGroup = sorted.length ? sorted[0].group : null;
  const negativeGroupNames = new Set(["depression", "anxiety", "stress"]);

  const severity = deviationScore < 0.5 ? "moderate" : "high";

  const alert = {
    type: "pattern_deviation",
    severity: severity,
    deviationScore: +deviationScore.toFixed(4),
    message: `Pattern differs from baseline (deviation: ${+deviationScore.toFixed(4)})`,
    groups: sorted // groups causing deviation, with increases
  };

  // if deviation is driven by positive emotions only, downgrade severity to 'low' and mark type 'positive_shift'
  if (sorted.length > 0 && !sorted.some(s => negativeGroupNames.has(s.group))) {
    alert.type = "positive_pattern_shift";
    alert.severity = "low";
    alert.message = `Pattern shift driven by positive/neutral emotions (deviation: ${+deviationScore.toFixed(4)})`;
  }

  return { triggered: true, alert, drivingGroups: sorted.map(s => s.group) };
}



// Replace detectNegativeSpikes with this function
export function detectEmotionSpikes(current, baseline) {
  const negativeSpikes = [];
  const positiveSpikes = [];

  // helper: whether a group is considered "negative"
  const negativeGroupNames = new Set(["depression", "anxiety", "stress"]);

  for (const [group, groupEmotions] of Object.entries(emotionGroups)) {
    for (const emotion of groupEmotions) {
      const curr = Number(current[emotion] || 0);
      const base = Number(baseline[emotion] || 0);
      const inc = +(curr - base);

      if (inc > NEGATIVE_SPIKE_THRESHOLD) {
        const entry = { group, emotion, increase: +inc.toFixed(4) };
        if (negativeGroupNames.has(group)) negativeSpikes.push(entry);
        else positiveSpikes.push(entry);
      }
    }
  }

  const nowAlerts = [];
  if (negativeSpikes.length > 0) {
    nowAlerts.push({
      type: "negative_spike",
      severity: negativeSpikes.length >= 2 ? "high" : "moderate",
      spikes: negativeSpikes,
      message: `Elevated negative emotions: ${negativeSpikes.map(s => s.emotion).join(", ")}`
    });
  }
  if (positiveSpikes.length > 0) {
    nowAlerts.push({
      type: "positive_spike",
      severity: "low",
      spikes: positiveSpikes,
      message: `Elevated positive/neutral emotions: ${positiveSpikes.map(s => s.emotion).join(", ")}`
    });
  }

  return {
    triggered: negativeSpikes.length > 0 || positiveSpikes.length > 0,
    negativeSpikes,
    positiveSpikes,
    alerts: nowAlerts,
    groups: [...new Set(negativeSpikes.map(s => s.group))] // only negative groups for escalation
  };
}


export async function detectPersistentNegativity(userId, UserHistory) {
  // recent entries
  const recent = await UserHistory.find({ userId })
    .sort({ timestamp: -1 })
    .limit(LOOKBACK_ENTRIES);

  const negDays = recent.filter((entry) => {
    const neg = ["depression", "anxiety", "stress"]
      .flatMap((g) => emotionGroups[g] || [])
      .reduce((sum, e) => sum + (Number(entry.emotions?.[e] || 0)), 0);

    const pos = (emotionGroups["positive"] || []).reduce(
      (sum, e) => sum + (Number(entry.emotions?.[e] || 0)),
      0
    );
    const NEG_POS_DIFF_THRESHOLD = 0.05;
    return neg - pos > NEG_POS_DIFF_THRESHOLD;

  }).length;

  if (negDays >= CONSECUTIVE_NEGATIVE_THRESHOLD) {
    return {
      triggered: true,
      alert: {
        type: "persistent_negativity",
        severity: "high",
        days: negDays,
        message: `Persistent negative emotions over ${negDays} of last ${LOOKBACK_ENTRIES} entries`
      }
    };
  }
  return { triggered: false };
}

export async function updateBaselineCounters({
  baselineDoc,
  detectedGroups = [],
  now = Date.now(),
  UserBaseline, // model for DB persistence
  highSeverityAlert = false
}) {
  // ensure modelCounters exists
  baselineDoc.modelCounters = baselineDoc.modelCounters || {};

  const changed = [];
  for (const group of detectedGroups) {
    baselineDoc.modelCounters[group] = baselineDoc.modelCounters[group] || {
      occurrences: 0,
      consecutive: 0,
      lastAlertAt: null,
      cooldownUntil: null
    };

    const mc = baselineDoc.modelCounters[group];

    // increment occurrences
    mc.occurrences = (mc.occurrences || 0) + 1;

    // consecutive logic: if last detection time is recent (within timeframe), increment; else reset
    // For simplicity: if a recent lastAlertAt exists within 48h, treat as consecutive; otherwise reset
    const RECENT_MS = 48 * 60 * 60 * 1000;
    if (mc.lastAlertAt && (now - new Date(mc.lastAlertAt).getTime()) <= RECENT_MS) {
      mc.consecutive = (mc.consecutive || 0) + 1;
    } else {
      mc.consecutive = 1;
    }

    mc.lastAlertAt = new Date(now);
    // set cooldown for high severity alerts
    if (highSeverityAlert) {
      mc.cooldownUntil = new Date(now + ALERT_COOLDOWN_MS);
    }

    changed.push({ group, occurrences: mc.occurrences, consecutive: mc.consecutive });
  }

  baselineDoc.updatedAt = new Date(now);
  // persist
  await UserBaseline.updateOne({ _id: baselineDoc._id }, { $set: { modelCounters: baselineDoc.modelCounters, updatedAt: baselineDoc.updatedAt } });

  return { baselineDoc, changed };
}

export function shouldSuppressAlert(baselineDoc, group, now = Date.now()) {
  const mc = baselineDoc.modelCounters?.[group];
  if (!mc) return false;
  if (mc.cooldownUntil && new Date(mc.cooldownUntil).getTime() > now) return true;
  return false;
}
export function enrichAlertsWithMessages(alerts) {
  return alerts.map(a => {
    let msg;
    if (a.type === "negative_spike") {
      const emoList = a.spikes.map(s => s.emotion).join(", ");
      msg = `It seems your emotions spiked with ${emoList} today. That can feel overwhelming—try to notice what might have triggered it.`;
    } else if (a.type === "positive_spike") {
      const emoList = a.spikes.map(s => s.emotion).join(", ");
      msg = `You had a strong rise in positive feelings like ${emoList}. That’s a wonderful sign of resilience—take a moment to celebrate it.`;
    } else if (a.type === "persistent_negativity") {
      msg = `I’ve noticed that in several recent entries, difficult emotions outweighed positive ones. This might mean you’re carrying a heavy load—consider reaching out for support.`;
    } else if (a.type === "pattern_deviation" && a.severity !== "low") {
      msg = `Your current emotional state feels noticeably different from your usual self, leaning towards difficult feelings. It may help to slow down and reflect.`;
    } else if (a.type === "positive_pattern_shift") {
      msg = `Your emotions shifted in a positive direction compared to your usual baseline—great progress!`;
    } else {
      msg = a.message; // fallback
    }
    return { ...a, therapeuticMessage: msg };
  });
}

export function composeRecommendationAndAlerts(alerts) {
  const enriched = enrichAlertsWithMessages(alerts);

  const hasHigh = enriched.some(a => a.severity === "high");
  const hasNegative = enriched.some(a =>
    a.type === "negative_spike" ||
    a.type === "persistent_negativity" ||
    (a.type === "pattern_deviation" && a.severity !== "low")
  );
  const hasOnlyPositive = enriched.length > 0 && enriched.every(a =>
    a.type === "positive_spike" || a.type === "positive_pattern_shift"
  );

  let recommendation;
  if (enriched.length === 0) {
    recommendation = "Patterns stable within normal range. Keep engaging in healthy habits.";
  } else if (hasHigh && hasNegative) {
    recommendation = "Consider contacting a mental health professional.";
  } else if (hasOnlyPositive) {
    recommendation = "Positive shift detected. Celebrate this growth and keep nurturing these moments.";
  } else {
    recommendation = "Monitor closely. Try stress-management techniques or supportive conversation.";
  }

  return { alerts: enriched, recommendation };
}
