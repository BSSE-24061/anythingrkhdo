const Blog = require("../models/blogModel");

const publishArticle = async (req, res) => {
  try {
    const { author_user_id, title, body } = req.body;

    if (!author_user_id || !title || !body) {
      return res
        .status(400)
        .json({ error: "Author ID, Title, and Body are required" });
    }

    const newArticle = await Blog.createArticle(req.body);
    res
      .status(201)
      .json({ message: "Article published successfully", article: newArticle });
  } catch (error) {
    console.error("Error publishing article:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getBlogFeed = async (req, res) => {
  try {
    const userId = req.query.userId || null;
    const articles = await Blog.getArticles(userId);
    res.status(200).json(articles);
  } catch (error) {
    console.error("Error fetching blog feed:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getPendingArticles = async (req, res) => {
  try {
    const userId = req.query.userId || null;
    const articles = await Blog.getPendingArticles(userId);
    res.status(200).json(articles);
  } catch (error) {
    console.error("Error fetching pending articles:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const commentOnArticle = async (req, res) => {
  try {
    const { article_id, user_id, body } = req.body;

    if (!article_id || !user_id || !body) {
      return res
        .status(400)
        .json({ error: "Article ID, User ID, and Body are required" });
    }

    const newComment = await Blog.addComment(req.body);
    res.status(201).json({ message: "Comment added", comment: newComment });
  } catch (error) {
    console.error("Error adding comment:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const saveBookmark = async (req, res) => {
  try {
    const { article_id, user_id } = req.body;

    if (!article_id || !user_id) {
      return res
        .status(400)
        .json({ error: "Article ID and User ID are required" });
    }

    const bookmark = await Blog.bookmarkArticle(req.body);
    res
      .status(201)
      .json({ message: "Article bookmarked successfully", bookmark });
  } catch (error) {
    console.error("Error bookmarking article:", error.message);
    // Handle if they try to bookmark the exact same article twice
    if (error.code === "23505") {
      return res
        .status(400)
        .json({ error: "You already bookmarked this article" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getUserBookmarks = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const bookmarks = await Blog.getUserBookmarks(userId);
    res.status(200).json(bookmarks);
  } catch (error) {
    console.error("Error fetching bookmarks:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const removeBookmark = async (req, res) => {
  try {
    const { article_id, user_id } = req.query;

    if (!article_id || !user_id) {
      return res
        .status(400)
        .json({ error: "Article ID and User ID are required" });
    }

    const bookmark = await Blog.removeBookmark(article_id, user_id);
    res.status(200).json({ message: "Bookmark removed successfully", bookmark });
  } catch (error) {
    console.error("Error removing bookmark:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getArticle = async (req, res) => {
  try {
    const articleId = req.params.articleId;
    const userId = req.query.userId; // Get user_id from query params

    const article = await Blog.getArticleById(articleId);

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    const comments = await Blog.getArticleComments(articleId);
    
    // Check if current user has already liked this article
    let userHasLiked = false;
    if (userId) {
      userHasLiked = await Blog.checkUserLiked(articleId, userId);
    }

    res.status(200).json({ 
      article: {
        ...article,
        user_has_liked: userHasLiked
      }, 
      comments 
    });
  } catch (error) {
    console.error("Error fetching article:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addLike = async (req, res) => {
  try {
    const { article_id, user_id } = req.body;
    const like = await Blog.likeArticle(article_id, user_id);
    res.status(201).json({ message: "Article liked!", like });
  } catch (error) {
    // If they click like twice, Postgres might throw a duplicate key error (23505)
    if (error.code === "23505")
      return res.status(400).json({ error: "Already liked" });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateArticleStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["active", "hidden", "deleted"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid article status" });
    }

    const article = await Blog.updateArticleStatus(
      req.params.articleId,
      status,
    );
    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.status(200).json({ message: "Article status updated", article });
  } catch (error) {
    console.error("Error updating article status:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteArticle = async (req, res) => {
  try {
    const article = await Blog.deleteArticle(req.params.articleId);
    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.status(200).json({ message: "Article deleted successfully", article });
  } catch (error) {
    console.error("Error deleting article:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  publishArticle,
  getBlogFeed,
  getPendingArticles,
  commentOnArticle,
  saveBookmark,
  removeBookmark,
  getUserBookmarks,
  getArticle,
  addLike,
  updateArticleStatus,
  deleteArticle,
};
