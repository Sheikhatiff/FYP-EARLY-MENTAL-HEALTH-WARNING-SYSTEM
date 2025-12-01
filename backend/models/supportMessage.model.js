import mongoose from "mongoose";

const supportMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userPhoto: {
      type: String,
      default: "default.jpg",
    },
    userRole: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    message: {
      type: String,
      required: [true, "Message cannot be empty"],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    messageType: {
      type: String,
      enum: ["text", "support", "system"],
      default: "text",
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
supportMessageSchema.index({ createdAt: -1 });
supportMessageSchema.index({ userId: 1 });

const SupportMessage = mongoose.model("SupportMessage", supportMessageSchema);

export default SupportMessage;
