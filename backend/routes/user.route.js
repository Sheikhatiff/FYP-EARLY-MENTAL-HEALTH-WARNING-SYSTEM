import express from "express";
import {
  adminUpdateUser,
  checkUpdateReq,
  createUser,
  deleteMe,
  deleteUser,
  getAllUsers,
  getUserById,
  updatePassword,
  updateUser,
  uploadUserPhoto,
  getOnlineStatus,
  getEmailNotificationPreferences,
  updateEmailNotificationPreferences,
} from "../controllers/user.controller.js";
import { restrictTo, verifyToken } from "../middleware/auth.middleware.js";

const UserRouter = express.Router();

UserRouter.use(verifyToken);

UserRouter.delete("/deleteMe", deleteMe);
UserRouter.patch("/updateMyPassword", updatePassword);
UserRouter.patch("/updateMe", checkUpdateReq, uploadUserPhoto, updateUser);

// Email notification preferences routes
UserRouter.get("/email-preferences", getEmailNotificationPreferences);
UserRouter.patch("/email-preferences", updateEmailNotificationPreferences);

UserRouter.use(restrictTo("admin"));

UserRouter.route("/").get(getAllUsers).post(createUser);
UserRouter.get("/status/online", getOnlineStatus);
UserRouter.route("/:_id").get(getUserById).delete(deleteUser).patch(updateUser);

UserRouter.patch("/admin/:_id", adminUpdateUser);

export default UserRouter;
