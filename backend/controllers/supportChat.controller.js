import SupportMessage from "../models/supportMessage.model.js";
import User from "../models/user.model.js";

// Get recent messages with pagination
export const getMessages = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const messages = await SupportMessage.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await SupportMessage.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          hasMore: skip + messages.length < total,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
};

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
    }

    // Get user details
    const user = await User.findById(userId).select("name photo role");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Create message
    const newMessage = await SupportMessage.create({
      userId: user._id,
      userName: user.name,
      userPhoto: user.photo,
      userRole: user.role,
      message: message.trim(),
    });

    // Populate and return
    const populatedMessage = await SupportMessage.findById(newMessage._id).lean();

    // Emit to all connected clients via Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.emit("support:message", populatedMessage);
    }

    res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

// Get online users
export const getOnlineUsers = async (req, res) => {
  try {
    const userSockets = req.app.get("userSockets");
    const onlineUserIds = Array.from(userSockets.keys());

    const onlineUsers = await User.find({
      _id: { $in: onlineUserIds },
    })
      .select("_id name photo role")
      .lean();

    res.status(200).json({
      success: true,
      data: onlineUsers,
    });
  } catch (error) {
    console.error("Error fetching online users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch online users",
    });
  }
};

// Delete message (admin only)
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    // Check if user is admin or message owner
    const message = await SupportMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (
      req.user.role !== "admin" &&
      message.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      });
    }

    await SupportMessage.findByIdAndDelete(messageId);

    // Emit delete event
    const io = req.app.get("io");
    if (io) {
      io.emit("support:message:deleted", { messageId });
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
    });
  }
};
