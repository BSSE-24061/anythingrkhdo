const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

// POST /api/chat/room - Start or get a chat room
router.post("/room", chatController.initializeRoom);

// POST /api/chat/message - Send a message
router.post("/message", chatController.sendMessage);

// PATCH /api/chat/message/:messageId/read - Mark one message as read
router.patch("/message/:messageId/read", chatController.markMessageRead);

// GET /api/chat/room/:roomId - Load messages for a chat
router.get("/room/:roomId", chatController.getMessages);

// PATCH /api/chat/room/:roomId/read - Mark a room as read for a user
router.patch("/room/:roomId/read", chatController.markRoomRead);

// GET /api/chat/inbox/:userId - Get all chat rooms for a user
router.get("/inbox/:userId", chatController.getInbox);

module.exports = router;
