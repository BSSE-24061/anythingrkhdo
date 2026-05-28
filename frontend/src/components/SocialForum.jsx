import { useEffect, useState } from "react";
import { Flag, Heart, MessageCircle, Plus, X, Eye, AlertTriangle } from "lucide-react";

import { forumApi } from "../utils/apiHelper";
import { getStoredUser } from "../utils/session";

const emptyForm = { category: "", title: "", body: "" };

const SocialForum = ({ title = "Health Forum" }) => {
  const user = getStoredUser();
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [replyBody, setReplyBody] = useState("");
  const [reportBody, setReportBody] = useState("");
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [liking, setLiking] = useState({});
  const [postLikeCounts, setPostLikeCounts] = useState({});
  const [notice, setNotice] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);

  const loadPosts = async () => {
    try {
      const response = await forumApi.feed(user?.id);
      const rows = response.data || [];
      setPosts(rows);

      const counts = {};
      const likedIds = new Set();
      rows.forEach((post) => {
        counts[post.post_id] = parseInt(post.likes_count || 0, 10);
        if (post.user_has_liked) likedIds.add(post.post_id);
      });
      setLikedPosts(likedIds);
      setPostLikeCounts(counts);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const openPost = async (postId) => {
    try {
      const response = await forumApi.getPost(postId);
      setSelectedPost(response.data.post);
      setReplies(response.data.replies || []);
      setShowReportForm(false);
      // Refresh the posts list to show updated view count in the feed immediately
      loadPosts();
    } catch (error) {
      console.error(error);
    }
  };

  const createPost = async (event) => {
    event.preventDefault();
    try {
      await forumApi.createPost({ ...form, user_id: user.id });
      setForm(emptyForm);
      setComposerOpen(false);
      setNotice("Forum post created.");
      loadPosts();
    } catch (error) {
      console.error(error);
    }
  };

  const addReply = async () => {
    if (!selectedPost || !replyBody.trim()) return;
    try {
      await forumApi.reply({
        post_id: selectedPost.post_id,
        user_id: user.id,
        body: replyBody.trim(),
      });
      setReplyBody("");
      openPost(selectedPost.post_id);
      loadPosts();
    } catch (error) {
      console.error(error);
    }
  };

  const reportPost = async () => {
    if (!selectedPost || !reportBody.trim()) return;
    try {
      await forumApi.report({
        post_id: selectedPost.post_id,
        user_id: user.id,
        reason: "other",
        description: reportBody.trim(),
      });
      setReportBody("");
      setShowReportForm(false);
      setNotice("Report submitted for moderation.");
    } catch (error) {
      console.error(error);
    }
  };

  const likePost = async (postId, event) => {
    if (event) event.stopPropagation(); // Block from opening the details popup

    if (likedPosts.has(postId) || liking[postId]) {
      setNotice("You already liked this post.");
      return;
    }

    setLiking((prev) => ({ ...prev, [postId]: true }));
    try {
      await forumApi.like({ post_id: postId, user_id: user.id });
      setLikedPosts((prev) => new Set(prev).add(postId));
      setPostLikeCounts((prev) => ({
        ...prev,
        [postId]: parseInt(prev[postId] || 0, 10) + 1,
      }));
      setNotice("Thanks for liking this post.");
    } catch (error) {
      const message =
        error?.response?.data?.error || error?.message || "Unable to like post.";
      if (message.toLowerCase().includes("already")) {
        setLikedPosts((prev) => new Set(prev).add(postId));
        setNotice("You already liked this post.");
      }
      console.error(error);
    } finally {
      setLiking((prev) => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <div className="content-page social-page">
      <section className="panel social-header">
        <div>
          <p className="eyebrow">{user?.role === "doctor" ? "Doctor Portal" : "Patient Portal"}</p>
          <h2>{title}</h2>
          <p className="muted">
            Connect with the community, discuss medical insights, and ask general healthcare questions.
          </p>
        </div>
        <button className="btn-main" type="button" onClick={() => setComposerOpen(true)}>
          <Plus size={18} />
          Create Post
        </button>
      </section>

      {notice && (
        <div style={{ maxWidth: "680px", margin: "10px auto" }}>
          <p className="alert alert-success" style={{ margin: 0 }}>{notice}</p>
        </div>
      )}

      {/* Main Twitter-like Scrollable Timeline */}
      <div className="x-timeline">
        {posts.length ? (
          posts.map((post) => {
            const authorInitial = post.author_name ? post.author_name[0] : "M";
            const hasLiked = likedPosts.has(post.post_id);
            return (
              <div
                className="x-tweet"
                key={post.post_id}
                onClick={() => openPost(post.post_id)}
                role="button"
                tabIndex={0}
              >
                {/* Left side circular avatar */}
                <div className="x-avatar">{authorInitial}</div>

                {/* Right side content */}
                <div className="x-tweet-content">
                  <div className="x-tweet-header">
                    <div className="x-tweet-author-info">
                      <span>{post.author_name || "Member"}</span>
                      {post.author_role && (
                        <span className="x-tweet-author-role">{post.author_role}</span>
                      )}
                      <span className="x-tweet-dot">·</span>
                      <span className="x-tweet-date">
                        {post.created_at
                          ? new Date(post.created_at).toLocaleDateString()
                          : "Today"}
                      </span>
                    </div>
                    {post.category && (
                      <span className="x-tweet-category">{post.category}</span>
                    )}
                  </div>

                  {/* Title & Body */}
                  <h3 className="x-tweet-title">{post.title}</h3>
                  <p className="x-tweet-body">{post.body}</p>

                  {/* Twitter action icons */}
                  <div className="x-action-bar">
                    <button
                      className="x-action-item action-comment"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPost(post.post_id);
                      }}
                    >
                      <MessageCircle size={17} />
                      <span>{post.replies_count || 0}</span>
                    </button>

                    <button
                      className={`x-action-item action-like ${hasLiked ? "liked" : ""}`}
                      type="button"
                      disabled={hasLiked || liking[post.post_id]}
                      onClick={(e) => likePost(post.post_id, e)}
                    >
                      <Heart size={17} fill={hasLiked ? "#db2777" : "none"} />
                      <span>{postLikeCounts[post.post_id] || 0}</span>
                    </button>

                    <div className="x-action-item action-view">
                      <Eye size={17} />
                      <span>{post.views_count || 0}</span>
                    </div>

                    <button
                      className="x-action-item action-report"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPost(post.post_id).then(() => setShowReportForm(true));
                      }}
                    >
                      <Flag size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-panel" style={{ padding: "40px", textAlign: "center" }}>
            No forum posts yet. Be the first to start a conversation!
          </div>
        )}
      </div>

      {/* Composer Modal */}
      {composerOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setComposerOpen(false);
        }}>
          <div className="modal-card modal-narrow" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <h3>Create Forum Post</h3>
                <p className="muted">Start a discussion for the community.</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setComposerOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form className="form-grid" onSubmit={createPost}>
              <input
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category: event.target.value }))
                }
                placeholder="Category (e.g. Cardiology, Diet, Vitals)"
              />
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Title"
                required
              />
              <textarea
                rows="7"
                value={form.body}
                onChange={(event) =>
                  setForm((current) => ({ ...current, body: event.target.value }))
                }
                placeholder="What do you want to discuss?"
                required
              />
              <div className="modal-actions">
                <button className="btn-ghost" type="button" onClick={() => setComposerOpen(false)}>
                  Cancel
                </button>
                <button className="btn-main" type="submit">
                  Publish Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Comments Pop-up Modal */}
      {selectedPost && (
        <div className="x-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedPost(null);
        }}>
          <div className="x-modal-card" role="dialog" aria-modal="true">
            {/* Modal Header */}
            <div className="x-modal-header">
              <h3>Post Thread</h3>
              <button className="icon-button" type="button" onClick={() => setSelectedPost(null)}>
                <X size={19} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="x-modal-body">
              {/* Original Post details styled in high-fidelity X-like detail */}
              <div className="x-modal-original-post">
                <div className="x-avatar">
                  {selectedPost.author_name ? selectedPost.author_name[0] : "M"}
                </div>
                <div className="x-tweet-content">
                  <div className="x-tweet-header">
                    <div className="x-tweet-author-info">
                      <span>{selectedPost.author_name || "Member"}</span>
                      {selectedPost.author_role && (
                        <span className="x-tweet-author-role">{selectedPost.author_role}</span>
                      )}
                      <span className="x-tweet-dot">·</span>
                      <span className="x-tweet-date">
                        {selectedPost.created_at
                          ? new Date(selectedPost.created_at).toLocaleDateString()
                          : "Today"}
                      </span>
                    </div>
                    {selectedPost.category && (
                      <span className="x-tweet-category">{selectedPost.category}</span>
                    )}
                  </div>
                  <h3 className="x-modal-original-title">{selectedPost.title}</h3>
                  <p className="x-modal-original-body">{selectedPost.body}</p>

                  <div className="resource-meta" style={{ display: "flex", gap: "16px", color: "var(--muted)", fontSize: "0.88rem", marginTop: "8px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Eye size={15} /> {selectedPost.views_count || 0} views
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Heart size={15} /> {postLikeCounts[selectedPost.post_id] || 0} likes
                    </span>
                  </div>
                </div>
              </div>

              {/* Comments/Replies list */}
              <div className="x-comments-section">
                <h4 className="x-comments-title">Comments ({replies.length})</h4>
                <div className="comment-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {replies.length ? (
                    replies.map((reply) => {
                      const commenterInitial = reply.replier_name ? reply.replier_name[0] : "M";
                      return (
                        <div className="x-comment-card" key={reply.reply_id}>
                          <div className="x-comment-avatar">{commenterInitial}</div>
                          <div className="x-comment-content">
                            <div className="x-tweet-header" style={{ marginBottom: "2px" }}>
                              <div className="x-tweet-author-info" style={{ fontSize: "0.88rem" }}>
                                <strong>{reply.replier_name || "Member"}</strong>
                                {reply.replier_role && (
                                  <span className="x-tweet-author-role" style={{ fontSize: "0.7rem", padding: "0px 4px" }}>
                                    {reply.replier_role}
                                  </span>
                                )}
                                <span className="x-tweet-dot">·</span>
                                <span className="x-tweet-date" style={{ fontSize: "0.8rem" }}>
                                  {reply.created_at
                                    ? new Date(reply.created_at).toLocaleDateString()
                                    : "Today"}
                                </span>
                              </div>
                            </div>
                            <p className="x-comment-body">{reply.body}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="muted" style={{ padding: "10px 0" }}>No replies yet. Be the first to share your thoughts!</p>
                  )}
                </div>
              </div>

              {/* Comment Composer */}
              <div className="x-comment-composer">
                <div className="x-avatar" style={{ width: "36px", height: "36px", fontSize: "0.95rem" }}>
                  {user?.full_name ? user.full_name[0] : (user?.name ? user.name[0] : "U")}
                </div>
                <div className="x-comment-input-wrap">
                  <textarea
                    className="x-comment-textarea"
                    rows="2"
                    value={replyBody}
                    onChange={(event) => setReplyBody(event.target.value)}
                    placeholder="Post your reply..."
                  />
                  <div className="x-comment-actions">
                    <button className="btn-main small" onClick={addReply} type="button">
                      Reply
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsible Report Panel */}
              <button
                className="x-report-toggle"
                onClick={() => setShowReportForm(!showReportForm)}
                type="button"
              >
                {showReportForm ? "Hide Report Form" : "Flag / Report this post"}
              </button>

              {showReportForm && (
                <div className="x-report-panel">
                  <h4>Report Post to Moderation</h4>
                  <textarea
                    rows="3"
                    value={reportBody}
                    onChange={(event) => setReportBody(event.target.value)}
                    placeholder="Please specify why this post is inappropriate..."
                    style={{
                      width: "100%",
                      borderRadius: "10px",
                      border: "1.5px solid rgba(239, 68, 68, 0.2)",
                      padding: "8px 12px",
                      fontSize: "0.9rem",
                      outline: "none"
                    }}
                  />
                  <button
                    className="btn-ghost small"
                    onClick={reportPost}
                    type="button"
                    style={{
                      borderColor: "rgba(239, 68, 68, 0.2)",
                      color: "var(--danger)",
                      alignSelf: "flex-end"
                    }}
                  >
                    Submit Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialForum;
