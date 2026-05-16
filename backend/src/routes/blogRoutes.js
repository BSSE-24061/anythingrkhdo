const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blogController");

// POST /api/blogs - Publish a new article
router.post("/", blogController.publishArticle);

// GET /api/blogs - Get all active articles
router.get("/", blogController.getBlogFeed);

// GET /api/blogs/pending - Get hidden articles waiting for approval
router.get("/pending", blogController.getPendingArticles);

// POST /api/blogs/comments - Add a comment
router.post("/comments", blogController.commentOnArticle);

// GET /api/blogs/bookmarks/:userId - Get user's bookmarked articles
router.get("/bookmarks/:userId", blogController.getUserBookmarks);

// POST /api/blogs/bookmarks - Bookmark an article
router.post("/bookmarks", blogController.saveBookmark);

// DELETE /api/blogs/bookmarks - Remove a bookmark
router.delete("/bookmarks", blogController.removeBookmark);

router.post("/likes", blogController.addLike);

// PATCH /api/blogs/:articleId/status - Approve or hide an article
router.patch("/:articleId/status", blogController.updateArticleStatus);

// DELETE /api/blogs/:articleId - Delete an article
router.delete("/:articleId", blogController.deleteArticle);

// GET /api/blogs/:articleId - Get a single article and its comments
router.get("/:articleId", blogController.getArticle);

module.exports = router;
