import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  getMessages,
  sendMessage,
  getOnlineUsers,
  deleteMessage,
} from "../controllers/supportChat.controller.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get messages with pagination
router.get("/messages", getMessages);

// Send a new message
router.post("/messages", sendMessage);

// Get online users
router.get("/online-users", getOnlineUsers);

// Delete message
router.delete("/messages/:messageId", deleteMessage);

export default router;
