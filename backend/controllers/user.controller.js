import mongoose from "mongoose";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/user.model.js";
import { generateTokenAndSetCookie } from "../utils/token.js";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img/users");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `user-${req.userId}-${Date.now()}.${ext}`);
  },
});
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Please upload only image"), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
export const uploadUserPhoto = upload.single("photo");

export const createUser = async (req, res) => {
  try {
    const { name, email, password, passwordConfirm } = req.body;

    const user = await User.create({
      name,
      email,
      password,
      passwordConfirm,
      isVerified: true,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { ...user._doc, password: undefined },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
    console.log(`Error in createUser: ${err.message}`);
    console.log(`Error in createUser: ${err}`);
    console.log(`Error in createUser: ${err.stack}`);
  }
};

export const getAllUsers = async (_, res) => {
  try {
    const users = await User.find().select(
      "-password -passwordConfirm"
    );
    res.status(200).json({
      success: true,
      result: users.length,
      data: { users },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
    console.log(`Error in getAllUsers: ${err.message}`);
    console.log(`Error in getAllUsers: ${err}`);
    console.log(`Error in getAllUsers: ${err.stack}`);
  }
};

export const getUserById = async (req, res) => {
  try {
    const { _id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await User.findById(_id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
    console.log(`Error in getUserById: ${err.message}`);
    console.log(`Error in getUserById: ${err}`);
    console.log(`Error in getUserById: ${err.stack}`);
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { _id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await User.findByIdAndDelete(_id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
    console.log(`Error in deleteUser: ${err.message}`);
    console.log(`Error in deleteUser: ${err}`);
    console.log(`Error in deleteUser: ${err.stack}`);
  }
};

export const updateUser = async (req, res) => {
  try {
    const _id = req.params._id|| req.userId;
    console.log("User ID to update:", _id);
    const updateData = req.body;
    console.log("Update data received:", updateData);
   if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await User.findByIdAndUpdate(_id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -passwordConfirm");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const oldPhoto = user.photo;

    if (req.file) {
      user.photo = req.file.filename;
      await user.save();

      if (oldPhoto && oldPhoto !== "default.png") {
        const oldPhotoPath = path.join(
          __dirname,
          "..",
          "public",
          "img",
          "users",
          oldPhoto
        );

        try {
          await fs.unlink(oldPhotoPath);
          console.log("Deleted old photo:", oldPhoto);
        } catch (err) {
          console.log("Failed to delete old photo:", err.message);
        }
      }
    }

    console.log("upadeted photo :", user.photo);
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: { user },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
    console.log(`Error in updateUser: ${err.message}`);
    console.log(`Error in updateUser: ${err}`);
    console.log(`Error in updateUser: ${err.stack}`);
  }
};

export const deleteMe = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.clearCookie("jwt");
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
    console.log(`Error in deleteMe: ${err.message}`);
    console.log(`Error in deleteMe: ${err}`);
    console.log(`Error in deleteMe: ${err.stack}`);
  }
};

export const updatePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, password, passwordConfirm } = req.body;

    if (!currentPassword || !password || !passwordConfirm) {
      return res.status(400).json({
        success: false,
        message:
          "Current password, new password, and confirmation are required",
      });
    }

    const user = await User.findById(userId).select("+password");

    if (!(await user.correctPassword(currentPassword, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.passwordChangedAt = Date.now();
    await user.save();
    console.log("Password updated successfully", password);
    generateTokenAndSetCookie(user, res, 200);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
    console.log(`Error in updatePassword: ${err.message}`);
    console.log(`Error in updatePassword: ${err}`);
    console.log(`Error in updatePassword: ${err.stack}`);
  }
};

export const checkUpdateReq = async (req, res, next) => {
  try {
    req.userId = req.user._id;
    if (req.body?.password || req.body?.passwordConfirm)
      return res.status(400).json({
        success: false,
        message:
          "This route is not for password updates. Use /updateMyPassword.",
      });
console.log("checkUpdateReq passed");
    next();
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
    console.log(`Error in updateMe: ${err.message}`);
    console.log(`Error in updateMe: ${err}`);
    console.log(`Error in updateMe: ${err.stack}`);
  }
};

export const adminUpdateUser = async (req, res) => {
  try {
    const { _id } = req.params;
    const { name, role, password, confirmPassword, email } = req.body;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findById(_id).select("+password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (name !== undefined && name !== "") user.name = name;
    if (role !== undefined && role !== "") user.role = role;
    if (email !== undefined && email !== "") user.email = email;

    if (
      password &&
      password.trim() !== "" &&
      confirmPassword &&
      confirmPassword.trim() !== ""
    ) {
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "Password and confirm password do not match",
        });
      }
      user.password = password;
      user.passwordConfirm = confirmPassword;
    }
    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully by admin",
      data: {
        _id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(`Error in adminUpdateUser: ${err.message}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get online status for all users
 */
export const getOnlineStatus = async (req, res) => {
  try {
    const userSockets = req.app.get("userSockets");
    const onlineUserIds = Array.from(userSockets.keys());

    res.status(200).json({
      success: true,
      data: {
        onlineUserIds,
      },
    });
  } catch (err) {
    console.error(`Error in getOnlineStatus: ${err.message}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get user's email notification preferences
 */
export const getEmailNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('emailNotificationPreferences');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      data: user.emailNotificationPreferences || {
        enabled: true,
        journalEntries: true,
        deviationAlerts: true,
        emotionSpikes: true,
        persistentNegativity: true,
        patternWarnings: true,
        positiveMilestones: false,
        baselineUpdates: false
      }
    });
  } catch (err) {
    console.error(`Error in getEmailNotificationPreferences: ${err.message}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Update user's email notification preferences
 */
export const updateEmailNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const preferences = req.body;

    // Validate preferences object
    const allowedPreferences = [
      'enabled',
      'journalEntries',
      'deviationAlerts',
      'emotionSpikes',
      'persistentNegativity',
      'patternWarnings',
      'positiveMilestones',
      'baselineUpdates'
    ];

    const updateData = {};
    for (const key of allowedPreferences) {
      if (preferences.hasOwnProperty(key) && typeof preferences[key] === 'boolean') {
        updateData[`emailNotificationPreferences.${key}`] = preferences[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid preferences provided"
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('emailNotificationPreferences');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Email notification preferences updated successfully",
      data: user.emailNotificationPreferences
    });
  } catch (err) {
    console.error(`Error in updateEmailNotificationPreferences: ${err.message}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
