import { useEffect, useState } from "react";
<<<<<<< HEAD

import { forumApi } from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";

=======
import { forumApi, getErrorMessage } from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";

const CATEGORIES = [
  { name: "General", icon: "🌐" },
  { name: "Symptoms", icon: "🌡️" },
  { name: "Treatment", icon: "💊" },
  { name: "Wellness", icon: "🥗" },
  { name: "Support", icon: "🤝" },
];

>>>>>>> parent of 42a0ed9 (push)
const Forum = () => {
  const user = getStoredUser();
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [replies, setReplies] = useState([]);
<<<<<<< HEAD
  const [form, setForm] = useState({ category: "", title: "", body: "" });
  const [replyBody, setReplyBody] = useState("");
  const [reportBody, setReportBody] = useState("");
  const [userLikedPosts, setUserLikedPosts] = useState(new Set());
  const [liking, setLiking] = useState({});
  const [postLikeCounts, setPostLikeCounts] = useState({});
  const [notice, setNotice] = useState("");

  const loadPosts = async () => {
    try {
      const response = await forumApi.feed(user?.id);
      setPosts(response.data || []);

      // Initialize like counts
      const counts = {};
      const likedIds = new Set();
      (response.data || []).forEach(post => {
        counts[post.post_id] = parseInt(post.likes_count || 0, 10);
        if (post.user_has_liked) {
          likedIds.add(post.post_id);
        }
      });
      setUserLikedPosts(likedIds);
      setPostLikeCounts(counts);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);
=======
  const [form, setForm] = useState({ category: "General", title: "", body: "" });
  const [replyBody, setReplyBody] = useState("");
  const [userLikedPosts, setUserLikedPosts] = useState(new Set());
  const [liking, setLiking] = useState({});
  const [postLikeCounts, setPostLikeCounts] = useState({});
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const loadPosts = async () => {
    try {
      const response = await forumApi.feed();
      const fetchedPosts = response.data || [];
      setPosts(fetchedPosts);
      const counts = {};
      fetchedPosts.forEach(post => { counts[post.post_id] = post.likes_count || 0; });
      setPostLikeCounts(counts);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load forum posts."));
    }
  };

  useEffect(() => { loadPosts(); }, []);
>>>>>>> parent of 42a0ed9 (push)

  const openPost = async (postId) => {
    try {
      const response = await forumApi.getPost(postId);
      setSelectedPost(response.data.post);
      setReplies(response.data.replies || []);
<<<<<<< HEAD
    } catch (error) {
      console.error(error);
=======
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to open post."));
>>>>>>> parent of 42a0ed9 (push)
    }
  };

  const createPost = async (event) => {
    event.preventDefault();
<<<<<<< HEAD
    try {
      await forumApi.createPost({ ...form, user_id: user.id });
      setForm({ category: "", title: "", body: "" });
      loadPosts();
    } catch (error) {
      console.error(error);
=======
    if (!user?.id) return;
    try {
      await forumApi.createPost({ ...form, user_id: user.id });
      setForm({ category: "General", title: "", body: "" });
      setShowCreate(false);
      loadPosts();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create post."));
>>>>>>> parent of 42a0ed9 (push)
    }
  };

  const addReply = async () => {
<<<<<<< HEAD
    if (!selectedPost || !replyBody) return;
=======
    if (!selectedPost || !replyBody || !user?.id) return;
>>>>>>> parent of 42a0ed9 (push)
    try {
      await forumApi.reply({ post_id: selectedPost.post_id, user_id: user.id, body: replyBody });
      setReplyBody("");
      openPost(selectedPost.post_id);
<<<<<<< HEAD
    } catch (error) {
      console.error(error);
    }
  };

  const reportPost = async () => {
    if (!selectedPost || !reportBody) return;
    try {
      await forumApi.report({ post_id: selectedPost.post_id, user_id: user.id, reason: "other", description: reportBody });
      setReportBody("");
    } catch (error) {
      console.error(error);
    }
  };

  const likePost = async (postId) => {
    if (userLikedPosts.has(postId)) {
      setNotice("You already liked this post.");
      return;
    }
    if (liking[postId]) return;

    setLiking((prev) => ({ ...prev, [postId]: true }));
    try {
      await forumApi.like({ post_id: postId, user_id: user.id });
      setUserLikedPosts((prev) => new Set(prev).add(postId));
      setPostLikeCounts((prev) => ({
        ...prev,
        [postId]: parseInt(prev[postId] || 0, 10) + 1,
      }));
      setNotice("Thanks for liking this post.");
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || "Unable to like post.";
      if (message.toLowerCase().includes("already")) {
        setUserLikedPosts((prev) => new Set(prev).add(postId));
        setNotice("You already liked this post.");
      }
      console.error(error);
    } finally {
      setLiking((prev) => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <>
      <section className="panel">
        <p className="eyebrow">{user?.role ? `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Portal` : "Health Portal"}</p>
        <h2 style={{ marginTop: 4 }}>Health Forum</h2>
        <p className="muted">
          Post, discuss, reply, and report items for moderation.
        </p>
      </section>

      {notice && <p className="alert alert-success" style={{ margin: "24px 0" }}>{notice}</p>}

      <section className="grid-layout two-col" style={{ gap: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 32, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
            <div className="section-heading" style={{ marginBottom: 24 }}><h3 style={{ fontSize: "1.5rem", color: "#0f172a", margin: 0 }}>Create Post</h3></div>
            <form className="form-grid" onSubmit={createPost}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <input style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #cbd5e1", outline: "none" }} value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Category" />
                <input style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #cbd5e1", outline: "none" }} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Title" required />
                <textarea style={{ padding: "16px", borderRadius: 12, border: "1px solid #cbd5e1", outline: "none", resize: "vertical" }} rows="6" value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} placeholder="What do you want to discuss?" required />
                <button type="submit" className="btn-main" style={{ padding: "14px", borderRadius: 12, marginTop: 8 }}>Publish Post</button>
              </div>
            </form>
          </div>

          <div style={{ background: "#fff", borderRadius: 24, padding: 32, border: "1px solid #e2e8f0" }}>
            <div className="section-heading" style={{ marginBottom: 24 }}><h3 style={{ fontSize: "1.5rem", color: "#0f172a", margin: 0 }}>Forum Feed</h3></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {posts.length ? posts.map((post) => (
                <div key={post.post_id} style={{ background: "#f8fafc", borderRadius: 16, padding: 20, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <strong style={{ fontSize: "1.2rem", color: "#0f172a" }}>{post.title}</strong>
                    <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 700 }}>{post.author_name || post.user_id}</span>
                  </div>
                  <p style={{ color: "#475569", margin: "0 0 16px 0", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.body}</p>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button className="btn-soft small" onClick={() => openPost(post.post_id)} style={{ padding: "6px 16px", borderRadius: 8 }}>Open</button>
                    <button
                      onClick={() => likePost(post.post_id)}
                      disabled={userLikedPosts.has(post.post_id) || liking[post.post_id]}
                      style={{
                        padding: "6px 16px", borderRadius: 8, border: "none", fontWeight: 700,
                        background: userLikedPosts.has(post.post_id) ? "#fef2f2" : "#fff",
                        color: userLikedPosts.has(post.post_id) ? "#ef4444" : "#64748b",
                        border: userLikedPosts.has(post.post_id) ? "1px solid #fecaca" : "1px solid #cbd5e1",
                        opacity: liking[post.post_id] ? 0.6 : 1,
                        cursor: (userLikedPosts.has(post.post_id) || liking[post.post_id]) ? "not-allowed" : "pointer"
                      }}
                    >
                      {liking[post.post_id] ? "Liking..." : (userLikedPosts.has(post.post_id) ? "❤️ Liked" : "🤍 Like")} ({postLikeCounts[post.post_id] || 0})
                    </button>
                  </div>
                </div>
              )) : <div style={{ padding: 24, textAlign: "center" }}><p className="muted" style={{ margin: 0 }}>No forum posts yet.</p></div>}
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 24, padding: 32, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", height: "fit-content", position: "sticky", top: 24 }}>
          <div className="section-heading" style={{ marginBottom: 24 }}><h3 style={{ fontSize: "1.5rem", color: "#0f172a", margin: 0 }}>Selected Post</h3></div>
          {selectedPost ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ background: "#f1f5f9", borderRadius: 16, padding: 24, borderLeft: "4px solid #4f46e5" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "1.4rem", color: "#0f172a" }}>{selectedPost.title}</h4>
                <p style={{ margin: 0, color: "#334155", lineHeight: 1.6 }}>{selectedPost.body}</p>
              </div>

              <div>
                <h4 style={{ margin: "0 0 16px 0", color: "#1e293b" }}>Replies</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {replies.length ? replies.map((reply) => (
                    <div key={reply.reply_id} style={{ background: "#f8fafc", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0" }}>
                      <strong style={{ display: "block", marginBottom: 8, color: "#0f172a" }}>{reply.replier_name}</strong>
                      <p style={{ margin: 0, color: "#475569" }}>{reply.body}</p>
                    </div>
                  )) : <p className="muted" style={{ margin: 0 }}>No replies yet.</p>}
                </div>
              </div>

              <div>
                <h4 style={{ margin: "0 0 12px 0", color: "#1e293b" }}>Reply</h4>
                <textarea
                  rows="3"
                  value={replyBody}
                  onChange={(event) => setReplyBody(event.target.value)}
                  placeholder="Write a reply"
                  style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #cbd5e1", outline: "none", resize: "vertical", marginBottom: 12 }}
                />
                <button className="btn-main" onClick={addReply} style={{ padding: "10px 24px", borderRadius: 10 }}>Send Reply</button>
              </div>

              <div style={{ paddingTop: 24, borderTop: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 12px 0", color: "#ef4444" }}>Report</h4>
                <textarea
                  rows="3"
                  value={reportBody}
                  onChange={(event) => setReportBody(event.target.value)}
                  placeholder="Report details"
                  style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #cbd5e1", outline: "none", resize: "vertical", marginBottom: 12 }}
                />
                <button className="btn-soft" style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", padding: "10px 24px", borderRadius: 10 }} onClick={reportPost}>Report Post</button>
              </div>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: "center", background: "#f8fafc", borderRadius: 16, border: "2px dashed #cbd5e1" }}>
              <p className="muted" style={{ margin: 0 }}>Open a post from the feed to view details, reply, or report it.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Forum;
=======
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send reply."));
    }
  };

  const likePost = (postId) => {
    if (userLikedPosts.has(postId) || liking[postId]) return;
    setLiking((prev) => ({ ...prev, [postId]: true }));
    setUserLikedPosts((prev) => new Set(prev).add(postId));
    setPostLikeCounts((prev) => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
    setTimeout(() => { setLiking((prev) => ({ ...prev, [postId]: false })); }, 300);
  };

  return (
    <div className="page-shell">
      <section className="hero-panel">
        <div>
          <h1 className="eyebrow">Community</h1>
          <h2>Health Forum</h2>
          <p className="muted">Connect with others and share your health journey.</p>
        </div>
        <div style={{ alignSelf: "end" }}>
          <button className="btn-main" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? "Cancel Post" : "+ New Discussion"}
          </button>
        </div>
      </section>

      {error && <p className="error-banner">{error}</p>}

      <div style={{ maxWidth: 800, margin: "0 auto", width: "100%", display: "grid", gap: 24 }}>
        
        {showCreate && (
          <section className="panel" style={{ border: "2px solid var(--accent)" }}>
            <h3 style={{ marginBottom: 16 }}>New Discussion</h3>
            <form className="form-grid" onSubmit={createPost}>
              <div className="form-columns">
                <label>Category
                  <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </label>
                <label>Title
                  <input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Headline..." required />
                </label>
              </div>
              <textarea rows="4" value={form.body} onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Share your experience..." required />
              <button type="submit" className="btn-main">Post Now</button>
            </form>
          </section>
        )}

        {selectedPost ? (
          <section className="panel">
            <button className="btn-ghost small" onClick={() => setSelectedPost(null)} style={{ marginBottom: 20 }}>← Back to Feed</button>
            <div style={{ borderLeft: "4px solid var(--accent)", paddingLeft: 20, marginBottom: 30 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span className="status-pill status-open" style={{ background: "rgba(0,86,179,0.08)", color: "var(--accent)" }}>{selectedPost.category}</span>
              </div>
              <h2 style={{ fontSize: "2rem", margin: "0 0 12px 0" }}>{selectedPost.title}</h2>
              <p style={{ fontSize: "1.2rem", lineHeight: 1.6 }}>{selectedPost.body}</p>
              <div style={{ marginTop: 16, fontWeight: 700 }} className="muted">By {selectedPost.author_name}</div>
            </div>

            <div style={{ display: "grid", gap: 16, marginBottom: 30 }}>
              <h3 style={{ fontSize: 18 }}>Replies ({replies.length})</h3>
              {replies.map(r => (
                <div key={r.reply_id} className="list-item" style={{ background: "var(--bg)", border: "none" }}>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>{r.replier_name}</div>
                  <p style={{ margin: 0 }}>{r.body}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <textarea 
                rows="3" 
                value={replyBody} 
                onChange={(e) => setReplyBody(e.target.value)} 
                placeholder="Write a reply..." 
                style={{ borderRadius: 12, border: "1.5px solid var(--line)", padding: 12 }} 
              />
              <button className="btn-main" onClick={addReply}>Post Reply</button>
            </div>
          </section>
        ) : (
          <div className="list-stack">
            {posts.map(post => (
              <article 
                key={post.post_id} 
                className="panel list-item" 
                style={{ padding: 24, cursor: "pointer" }} 
                onClick={() => openPost(post.post_id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                  <span className="status-pill status-open" style={{ background: "var(--bg)", color: "var(--accent)", border: "none" }}>{post.category}</span>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span className="muted" style={{ fontWeight: 700 }}>💬 {post.replies_count || 0}</span>
                    <span 
                      onClick={(e) => { e.stopPropagation(); likePost(post.post_id); }}
                      style={{ fontWeight: 700, color: userLikedPosts.has(post.post_id) ? "var(--danger)" : "var(--muted)" }}
                    >❤️ {postLikeCounts[post.post_id] || 0}</span>
                  </div>
                </div>
                <h3 style={{ fontSize: "1.5rem", margin: "0 0 10px 0" }}>{post.title}</h3>
                <p className="muted" style={{ fontSize: "1.1rem", lineHeight: 1.5 }}>{post.body.slice(0, 150)}...</p>
                <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "grid", placeItems: "center", fontSize: 10 }}>U</div>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{post.author_name}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Forum;
>>>>>>> parent of 42a0ed9 (push)
