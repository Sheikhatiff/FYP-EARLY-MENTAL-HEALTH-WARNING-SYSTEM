import mongoose from "mongoose";
import { decrypt, encrypt } from "../utils/encrypt.js";

const journalSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Untitled-Entry",
    },
    content: {
      type: String,
      required: [true, "there must be some content"],
      trim: true,
    },
    analysis: Object,
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

journalSchema.post("save", async function (doc, next) {
  try {
    await mongoose.model("User").findByIdAndUpdate(doc.user, {
      $inc: { totalJournals: 1 },
    });
    next();
  } catch (err) {
    next(err);
  }
});

journalSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;
  try {
    await mongoose
      .model("User")
      .findByIdAndUpdate(doc.user, { $inc: { totalJournals: -1 } });
  } catch (err) {
    console.error("decrement on findOneAndDelete error:", err);
  }
});

journalSchema.pre("save", async function () {
  if (this.isModified("content")) {
    this.content = encrypt(this.content);
  }
});

journalSchema.post(/^find/, function (result) {
  if (!result) return;

  if (Array.isArray(result)) {
    result.forEach((doc) => {
      if (doc.content) {
        try {
          doc.content = decrypt(doc.content);
        } catch (err) {
          console.error("Decryption error:", err);
        }
      }
    });
  } else {
    if (result.content) {
      try {
        result.content = decrypt(result.content);
      } catch (err) {
        console.error("Decryption error:", err);
      }
    }
  }
});

// .pre('save', function(next) {
//   if (!this.isModified('password') || this.isNew) return next();
//   this.passwordChangedAt = Date.now() - 1000;
//   next();
// });

const Journal = mongoose.model("Journal", journalSchema);

export default Journal;
