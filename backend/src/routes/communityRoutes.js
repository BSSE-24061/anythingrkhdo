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

// POST /api/community/likes - Like a forum post
router.post("/likes", communityController.likePost);

// GET /api/community/posts/:postId/replies - Get replies for a specific post
router.get("/posts/:postId/replies", communityController.loadReplies);

// Add this right before module.exports = router;
router.post("/reports", communityController.submitReport);

// GET /api/community/reports - View reported posts for moderation
router.get("/reports", communityController.getReports);

// PATCH /api/community/reports/:reportId/dismiss - Dismiss a single report
router.patch("/reports/:reportId/dismiss", communityController.dismissReport);

// PATCH /api/community/posts/:postId/status - Moderate a forum post
router.patch("/posts/:postId/status", communityController.updatePostStatus);

// DELETE /api/community/posts/:postId - Permanently remove a forum post
router.delete("/posts/:postId", communityController.deletePost);

module.exports = router;
