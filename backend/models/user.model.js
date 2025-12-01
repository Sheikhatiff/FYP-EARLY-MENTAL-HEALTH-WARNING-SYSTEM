import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please tell us your name"],
      trim: true,
    },
    email: {
      type: String,
      required: function () {
        return this.isNew;
      },
      unique: [true, "Email already exists"],
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, "please provide valid email"],
    },
    photo: { type: String, default: "default.png" },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin"],
    },
    password: {
      type: String,
      required: function () {
        return this.isNew;
      },
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: function () {
        return this.isNew;
      },
      validate: {
        validator: function (elm) {
          return elm === this.password;
        },
        message: "Password should be same",
      },
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    loginHistory: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        device: String,
        userAgent: String,
        ipAddress: String,
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    totalJournals: {
      type: Number,
      default: 0,
    },
    emailNotificationPreferences: {
      enabled: { type: Boolean, default: true },
      journalEntries: { type: Boolean, default: true },
      deviationAlerts: { type: Boolean, default: true },
      emotionSpikes: { type: Boolean, default: true },
      persistentNegativity: { type: Boolean, default: true },
      patternWarnings: { type: Boolean, default: true },
      positiveMilestones: { type: Boolean, default: false },
      baselineUpdates: { type: Boolean, default: false },
    },
    resetPasswordToken: String,
    resetTokenExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
    passwordChangedAt: Date,
  },
  { timestamps: true }
);

// Middleware to hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.passwordChangedAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// userSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
// userSchema.pre("save", function (next) {
//   if (!this.isActive) {
//     this.expireAt = new Date(Date.now() + 1 * 60 * 1000);
//   } else {
//     this.expireAt = undefined;
//   }
//   next();
// });

const User = mongoose.model("User", userSchema);

export default User;
