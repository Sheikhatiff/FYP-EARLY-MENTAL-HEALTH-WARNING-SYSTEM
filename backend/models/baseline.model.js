import mongoose from "mongoose";

const EmotionSchema = new mongoose.Schema({}, { strict: false });
const DeviationSchema = new mongoose.Schema({}, { strict: false });

const UserBaselineSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  emotions: { type: EmotionSchema, required: true },
  entryCount: { type: Number, default: 1 }, // Track number of entries for progressive weighting
  deviation: { type: DeviationSchema },
  modelCounters: {
    depression: {
      occurrences: { type: Number, default: 0 },
      consecutive: { type: Number, default: 0 },
      lastAlertAt: Date,
      cooldownUntil: Date
    },
    anxiety: { occurrences: Number, consecutive: Number, lastAlertAt: Date, cooldownUntil: Date },
    stress: { occurrences: Number, consecutive: Number, lastAlertAt: Date, cooldownUntil: Date },
    positive: { occurrences: Number, consecutive: Number },
    other: { occurrences: Number, consecutive: Number }
  },
  // Alert-type specific cooldowns to prevent duplicate notifications
  alertCooldowns: {
    "pattern_deviation": { cooldownUntil: Date, lastNotificationAt: Date },
    "negative_spike": { cooldownUntil: Date, lastNotificationAt: Date },
    "positive_spike": { cooldownUntil: Date, lastNotificationAt: Date },
    "persistent_negativity": { cooldownUntil: Date, lastNotificationAt: Date },
    "positive_pattern_shift": { cooldownUntil: Date, lastNotificationAt: Date }
  },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("UserBaseline", UserBaselineSchema);
