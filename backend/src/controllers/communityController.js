const Community = require("../models/communityModel");

const createPost = async (req, res) => {
  try {
    const { user_id, title, body } = req.body;

    if (!user_id || !title || !body) {
      return res
        .status(400)
        .json({ error: "User ID, Title, and Body are required" });
    }

    const newPost = await Community.createForumPost(req.body);
    res
      .status(201)
      .json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    console.error("Error creating post:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getFeed = async (req, res) => {
  try {
    const userId = req.query.userId || null;
    const posts = await Community.getForumPosts(userId);
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching feed:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getPost = async (req, res) => {
  try {
    const post = await Community.getForumPostById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    await Community.incrementViewCount(req.params.postId);
    const replies = await Community.getPostReplies(req.params.postId);
    res.status(200).json({ post, replies });
  } catch (error) {
    console.error("Error fetching post:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const replyToPost = async (req, res) => {
  try {
    const { post_id, user_id, body } = req.body;

    if (!post_id || !user_id || !body) {
      return res
        .status(400)
        .json({ error: "Post ID, User ID, and Body are required" });
    }

    const newReply = await Community.addReply(req.body);
    res.status(201).json({ message: "Reply added", reply: newReply });
  } catch (error) {
    console.error("Error adding reply:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const loadReplies = async (req, res) => {
  try {
    const postId = req.params.postId;

    const replies = await Community.getPostReplies(postId);
    res.status(200).json(replies);
  } catch (error) {
    console.error("Error fetching replies:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const likePost = async (req, res) => {
  try {
    const { post_id, user_id } = req.body;

    if (!post_id || !user_id) {
      return res.status(400).json({ error: " Post ID and User ID are required" });
    }

    const like = await Community.likePost(post_id, user_id);
    res.status(201).json({ message: "Post liked successfully", like });
  } catch (error) {
    console.error("Error liking post:", error.message);
    if (error.code === "23505" || error.message.toLowerCase().includes("already")) {
      return res.status(400).json({ error: "Already liked" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const submitReport = async (req, res) => {
  try {
    const { post_id, reported_by, user_id, reason, description } = req.body;
    const reporterId = reported_by || user_id;

    if (!post_id || !reporterId || !reason) {
      return res
        .status(400)
        .json({ error: "Post ID, reporter ID, and reason are required" });
    }

    const report = await Community.reportPost(
      post_id,
      reporterId,
      reason,
      description,
    );
    res.status(201).json({ message: "Post reported to admins", report });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await Community.getReportedPosts();
    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updatePostStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["active", "hidden", "deleted"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid forum status" });
    }

    const post = await Community.updateForumPostStatus(
      req.params.postId,
      status,
    );
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.status(200).json({ message: "Post status updated", post });
  } catch (error) {
    console.error("Error updating post status:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createPost,
  getFeed,
  getPost,
  replyToPost,
  loadReplies,
  submitReport,
  getReports,
  updatePostStatus,
};
