// controllers/mentalHealth.controller.js
import UserHistory from "../models/baseline_history.model.js";
import UserBaseline from "../models/baseline.model.js";
import { cosineSimilarity, emotionGroups, extractEmotionVector, buildUnionVectors, detectPatternDeviation,  detectPersistentNegativity, shouldSuppressAlert, updateBaselineCounters, composeRecommendationAndAlerts, detectEmotionSpikes } from "./model.controller.js";

export const getDeviation = async(req,res) => {
  try {
    const userId = req.user._id
    const deviation = await UserBaseline.findOne({ userId })
    if (!deviation || !deviation.deviation) {
      return res.status(404).json({ error: "No deviation data found" });
    }
    console.log(deviation)
    res.status(200).json({deviation});
  } catch (error) {
    console.error("getDeviation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// --- Baseline creation & update ---
export const createOrUpdateBaseline = async (userId, prediction) => 
{
  try {
    const emotions = extractEmotionVector(prediction);

    await UserHistory.create({ userId, emotions });

    let baseline = await UserBaseline.findOne({ userId });

    if (!baseline) {
      // First entry: baseline = emotions as-is
      baseline = await UserBaseline.create({ userId, emotions, entryCount: 1 });
    } else {
      // Progressive weighting for realistic baseline convergence
      // Entry 2: 50/50, Entry 3: 65/35, Entry 4+: 80/20
      const currentEntryCount = (baseline.entryCount || 1) + 1;
      let oldWeight, newWeight;

      if (currentEntryCount === 2) {
        // Entry 2: 50% old + 50% new
        oldWeight = 0.5;
        newWeight = 0.5;
      } else if (currentEntryCount === 3) {
        // Entry 3: 65% old + 35% new (gradual transition to 80/20)
        oldWeight = 0.65;
        newWeight = 0.35;
      } else {
        // Entry 4+: 80% old + 20% new (stabilized)
        oldWeight = 0.8;
        newWeight = 0.2;
      }

      const updated = { ...baseline.emotions };

      for (const e in emotions) {
        updated[e] =
          (baseline.emotions[e] || 0) * oldWeight + emotions[e] * newWeight;
      }

      baseline.emotions = updated;
      baseline.entryCount = currentEntryCount;
      baseline.updatedAt = new Date();
      await baseline.save();
    }
  } catch (error) {
    console.error("createOrUpdateBaseline error:", error);
    throw error;
  }
} 

export const detectDeviation = async (userId,prediction)=> {
  try {
   
    // 2. Extract current vector
    const current = extractEmotionVector(prediction) || {};

    // 3. Load baseline
    const baselineDoc = await UserBaseline.findOne({ userId });
    if (!baselineDoc || !baselineDoc.emotions) {
      // first-time: create baseline stub if desired
      return res.json({ status: "insufficient_data", alerts: [], recommendation: "Insufficient baseline data." });
    }
    const baseline = baselineDoc.emotions || {};
    // 4. Build vector union and compute similarity
    const { _, currVec, baseVec } = buildUnionVectors(current, baseline);
    const similarity = cosineSimilarity(currVec, baseVec);
    const deviationScore = 1 - similarity;

    // Compute group-wise increases (used by pattern detector)
    const groupIncreases = {};
    for (const [group, groupEmotions] of Object.entries(emotionGroups)) {
      let sumInc = 0;
      for (const e of groupEmotions) {
        sumInc += Math.max(0, (Number(current[e] || 0) - Number(baseline[e] || 0)));
      }
      groupIncreases[group] = +sumInc.toFixed(6);
    }

    // 5. Detect issues (independent detectors)
    const alerts = [];

    // pattern detector now returns drivingGroups
    const pattern = await detectPatternDeviation(similarity, deviationScore, groupIncreases);
    if (pattern.triggered) alerts.push(pattern.alert);

    // replace old call with new combined detector
    const spikesRes = detectEmotionSpikes(current, baseline);
    if (spikesRes.triggered) {
      spikesRes.alerts.forEach(a => alerts.push(a));
    }

    const persistent = await detectPersistentNegativity(userId, UserHistory);
    if (persistent.triggered) alerts.push(persistent.alert);

    // 6. Map detected alerts to high level groups to update baseline counters
    const detectedGroups = new Set();
    // from spikesRes.groups (these are only negative groups as implemented)
    if (spikesRes.groups && spikesRes.groups.length) spikesRes.groups.forEach(g => detectedGroups.add(g));
    // from persistent: add the negative groups
    if (persistent.triggered) {
      ["depression", "anxiety", "stress"].forEach(g => detectedGroups.add(g));
    }
    // from pattern_deviation: only add driving groups that are negative groups
    if (pattern.triggered && pattern.drivingGroups && pattern.drivingGroups.length) {
      const negativeGroupNames = new Set(["depression", "anxiety", "stress"]);
      pattern.drivingGroups.forEach(g => {
        if (negativeGroupNames.has(g)) detectedGroups.add(g);
      });
    }

    // 7. Check suppression (unchanged)
    const now = Date.now();
    const groupsArray = [...detectedGroups];
    const effectiveGroups = groupsArray.filter(g => !shouldSuppressAlert(baselineDoc, g, now));

    // 8. Update baseline counters for effective groups (unchanged)
    if (effectiveGroups.length > 0) {
      const highSeverity = alerts.some(a => a.severity === "high");
      await updateBaselineCounters({
        baselineDoc,
        detectedGroups: effectiveGroups,
        now,
        UserBaseline,
        highSeverityAlert: highSeverity
      });
    }

    // 9. Compose recommendation (update to be context-aware)
    // Pass the alerts to composeRecommendationAndAlerts which we'll also improve below
    const { recommendation } = composeRecommendationAndAlerts(alerts);

    baselineDoc.deviation = {
      status: "analyzed",
      similarity,
      deviationScore,
      alerts,
      recommendation,
    }
    await baselineDoc.save();
    // 10. Final output 

  } catch (err) {
    console.error("detectDeviation error:", err);
    throw err;
  }
}
