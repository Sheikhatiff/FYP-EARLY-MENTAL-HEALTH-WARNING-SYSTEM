import mongoose from "mongoose";

const EmotionSchema = new mongoose.Schema({}, { strict: false });

const UserHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  emotions: { type: EmotionSchema, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("UserHistory", UserHistorySchema);
