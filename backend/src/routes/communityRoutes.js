const express = require("express");
const router = express.Router();
const communityController = require("../controllers/communityController");

// POST /api/community/posts - Create a new forum post
router.post("/posts", communityController.createPost);

// GET /api/community/posts - Get all active posts
router.get("/posts", communityController.getFeed);

// GET /api/community/posts/:postId - Get a post with replies
router.get("/posts/:postId", communityController.getPost);

// POST /api/community/replies - Reply to a post
router.post("/replies", communityController.replyToPost);

// GET /api/community/posts/:postId/replies - Get replies for a specific post
router.get("/posts/:postId/replies", communityController.loadReplies);

// Add this right before module.exports = router;
router.post("/reports", communityController.submitReport);

// GET /api/community/reports - View reported posts for moderation
router.get("/reports", communityController.getReports);

// PATCH /api/community/posts/:postId/status - Moderate a forum post
router.patch("/posts/:postId/status", communityController.updatePostStatus);

module.exports = router;
