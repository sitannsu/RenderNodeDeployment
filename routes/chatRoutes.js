const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const authenticate = require("../middleware/auth.middleware");

// Get all chats for the logged-in user (admin or user)
router.get("/chats", authenticate, chatController.getAllChats);

// Get all messages between the logged-in user and another user
router.get(
  "/chats/messages/:otherUserId?",
  authenticate,
  chatController.getAllMessagesWithUser
);

// Send a message to another user
router.post(
  "/chats/messages/:otherUserId?",
  authenticate,
  chatController.sendMessage
);

// Get all messages between the logged-in user and another user
router.get(
  "/chats/user/:otherUserId?",
  authenticate,
  chatController.getChatsByUser
);
module.exports = router;
