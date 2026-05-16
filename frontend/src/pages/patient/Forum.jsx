import { useEffect, useState } from "react";
import { forumApi, getErrorMessage } from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";

const CATEGORIES = [
  { name: "General", icon: "🌐" },
  { name: "Symptoms", icon: "🌡️" },
  { name: "Treatment", icon: "💊" },
  { name: "Wellness", icon: "🥗" },
  { name: "Support", icon: "🤝" },
];

const Forum = () => {
  const user = getStoredUser();
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [form, setForm] = useState({ category: "General", title: "", body: "" });
  const [replyBody, setReplyBody] = useState("");
  const [userLikedPosts, setUserLikedPosts] = useState(new Set());
  const [liking, setLiking] = useState({});
  const [postLikeCounts, setPostLikeCounts] = useState({});
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const loadPosts = async () => {
    try {
      const response = await forumApi.feed(user?.id);
      const fetchedPosts = response.data || [];
      setPosts(fetchedPosts);
      const counts = {};
      const likedIds = new Set();
      fetchedPosts.forEach(post => {
        counts[post.post_id] = post.likes_count || 0;
        if (post.user_has_liked) {
          likedIds.add(post.post_id);
        }
      });
      setUserLikedPosts(likedIds);
      setPostLikeCounts(counts);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load forum posts."));
    }
  };

  useEffect(() => { loadPosts(); }, []);

  const openPost = async (postId) => {
    try {
      const response = await forumApi.getPost(postId);
      setSelectedPost(response.data.post);
      setReplies(response.data.replies || []);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to open post."));
    }
  };

  const createPost = async (event) => {
    event.preventDefault();
    if (!user?.id) return;
    try {
      await forumApi.createPost({ ...form, user_id: user.id });
      setForm({ category: "General", title: "", body: "" });
      setShowCreate(false);
      loadPosts();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create post."));
    }
  };

  const addReply = async () => {
    if (!selectedPost || !replyBody || !user?.id) return;
    try {
      await forumApi.reply({ post_id: selectedPost.post_id, user_id: user.id, body: replyBody });
      setReplyBody("");
      openPost(selectedPost.post_id);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send reply."));
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
      setPostLikeCounts((prev) => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
      setNotice("Thanks for liking this post.");
    } catch (err) {
      const message = getErrorMessage(err, "Unable to like post.");
      if (message.toLowerCase().includes("already")) {
        setUserLikedPosts((prev) => new Set(prev).add(postId));
        setNotice("You already liked this post.");
      } else {
        setError(message);
      }
    } finally {
      setLiking((prev) => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <div className="page-shell">
      <section className="hero-panel" style={{ background: "linear-gradient(135deg, #4f46e5 0%, #312e81 100%)", color: "#fff", borderRadius: 24, padding: "48px 40px", marginBottom: 32 }}>
        <div>
          <h1 className="eyebrow" style={{ color: "#a5b4fc", letterSpacing: "0.15em", textTransform: "uppercase" }}>Community</h1>
          <h2 style={{ color: "#f8fafc", fontSize: "3rem", margin: "12px 0", letterSpacing: "-0.03em" }}>Health Forum</h2>
          <p style={{ color: "#c7d2fe", fontSize: "1.2rem", maxWidth: 600, lineHeight: 1.6 }}>
            Connect with others, share your health journey, and find support in our safe and moderated community.
          </p>
        </div>
        <div style={{ alignSelf: "end", marginTop: 24 }}>
          <button 
            className="btn-main" 
            onClick={() => setShowCreate(!showCreate)}
            style={{ background: "#fff", color: "#4f46e5", padding: "12px 24px", fontSize: "1rem", border: "none" }}
          >
            {showCreate ? "Cancel Post" : "+ New Discussion"}
          </button>
        </div>
      </section>

      {error && <p className="error-banner" style={{ marginBottom: 24 }}>{error}</p>}
      {notice && <p className="alert alert-success" style={{ marginBottom: 24 }}>{notice}</p>}

      <div style={{ maxWidth: 840, margin: "0 auto", width: "100%", display: "grid", gap: 24 }}>
        
        {showCreate && (
          <section style={{ 
            background: "#fff", 
            borderRadius: 24, 
            padding: 32, 
            border: "2px solid #818cf8",
            boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.1)" 
          }}>
            <h3 style={{ marginBottom: 24, fontSize: "1.5rem", color: "#1e1b4b" }}>Start a New Discussion</h3>
            <form className="form-grid" onSubmit={createPost}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontWeight: 700, color: "#475569", fontSize: "0.9rem" }}>Category</label>
                  <select 
                    value={form.category} 
                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                    style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: "1rem", outline: "none" }}
                  >
                    {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontWeight: 700, color: "#475569", fontSize: "0.9rem" }}>Title</label>
                  <input 
                    value={form.title} 
                    onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} 
                    placeholder="What's on your mind?" 
                    required 
                    style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: "1rem", outline: "none" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 20 }}>
                <label style={{ fontWeight: 700, color: "#475569", fontSize: "0.9rem" }}>Message</label>
                <textarea 
                  rows="5" 
                  value={form.body} 
                  onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))} 
                  placeholder="Share your experience or ask a question..." 
                  required 
                  style={{ padding: "16px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: "1rem", outline: "none", resize: "vertical" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
                <button type="submit" className="btn-main" style={{ background: "#4f46e5", padding: "12px 32px" }}>Post Now</button>
              </div>
            </form>
          </section>
        )}

        {selectedPost ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <button 
              className="btn-ghost" 
              onClick={() => setSelectedPost(null)} 
              style={{ alignSelf: "flex-start", padding: "8px 16px", background: "#f1f5f9", borderRadius: 999, border: "none" }}
            >
              ← Back to Discussions
            </button>
            
            <section style={{ 
              background: "#fff", 
              borderRadius: 24, 
              padding: 32, 
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
              border: "1px solid #e2e8f0" 
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{ 
                  background: "rgba(79, 70, 229, 0.1)", 
                  color: "#4f46e5", 
                  padding: "6px 12px", 
                  borderRadius: 999, 
                  fontWeight: 800, 
                  fontSize: "0.85rem" 
                }}>
                  {selectedPost.category}
                </span>
                <span className="muted" style={{ fontSize: "0.9rem" }}>• Posted by</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#4f46e5", color: "#fff", display: "grid", placeItems: "center", fontSize: "0.7rem", fontWeight: 800 }}>
                    {selectedPost.author_name ? selectedPost.author_name[0].toUpperCase() : 'U'}
                  </div>
                  <strong style={{ color: "#1e293b", fontSize: "0.9rem" }}>{selectedPost.author_name}</strong>
                </div>
              </div>
              <h2 style={{ fontSize: "2rem", margin: "0 0 16px 0", color: "#0f172a", lineHeight: 1.3 }}>{selectedPost.title}</h2>
              <p style={{ fontSize: "1.15rem", lineHeight: 1.7, color: "#334155", whiteSpace: "pre-wrap" }}>{selectedPost.body}</p>
            </section>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h3 style={{ fontSize: "1.2rem", color: "#475569", margin: "8px 0 0 8px" }}>{replies.length} Replies</h3>
              
              {replies.map(r => (
                <div key={r.reply_id} style={{ 
                  background: "#fff", 
                  borderRadius: 16, 
                  padding: 24, 
                  border: "1px solid #e2e8f0",
                  marginLeft: 32,
                  position: "relative"
                }}>
                  <div style={{ position: "absolute", left: -32, top: 24, bottom: -24, width: 2, background: "#e2e8f0" }} />
                  <div style={{ position: "absolute", left: -32, top: 24, width: 32, height: 2, background: "#e2e8f0" }} />
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#cbd5e1", color: "#475569", display: "grid", placeItems: "center", fontWeight: 800 }}>
                      {r.replier_name ? r.replier_name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>{r.replier_name}</div>
                      <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <p style={{ margin: 0, color: "#334155", lineHeight: 1.6, fontSize: "1.05rem" }}>{r.body}</p>
                </div>
              ))}
            </div>

            <div style={{ 
              background: "#f8fafc", 
              borderRadius: 24, 
              padding: 24, 
              border: "1px solid #e2e8f0",
              marginTop: 16 
            }}>
              <h4 style={{ margin: "0 0 16px 0", color: "#1e1b4b" }}>Add a Reply</h4>
              <textarea 
                rows="4" 
                value={replyBody} 
                onChange={(e) => setReplyBody(e.target.value)} 
                placeholder="Share your thoughts..." 
                style={{ 
                  width: "100%", 
                  borderRadius: 12, 
                  border: "1px solid #cbd5e1", 
                  padding: 16, 
                  fontSize: "1rem", 
                  outline: "none", 
                  resize: "vertical",
                  marginBottom: 16,
                  background: "#fff"
                }} 
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button 
                  className="btn-main" 
                  onClick={addReply}
                  disabled={!replyBody.trim()}
                  style={{ background: replyBody.trim() ? "#4f46e5" : "#cbd5e1", padding: "10px 24px" }}
                >
                  Post Reply
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {posts.length ? posts.map(post => (
              <article 
                key={post.post_id} 
                style={{ 
                  background: "#fff", 
                  borderRadius: 20, 
                  padding: 24, 
                  border: "1px solid #e2e8f0",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }} 
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.05)";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
                onClick={() => openPost(post.post_id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#e0e7ff", color: "#4f46e5", display: "grid", placeItems: "center", fontSize: "1.2rem", fontWeight: 800 }}>
                      {post.author_name ? post.author_name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: "#1e293b" }}>{post.author_name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <span style={{ 
                          background: "#f1f5f9", 
                          color: "#475569", 
                          padding: "2px 8px", 
                          borderRadius: 6, 
                          fontSize: "0.75rem", 
                          fontWeight: 700 
                        }}>
                          {post.category}
                        </span>
                        <span className="muted" style={{ fontSize: "0.8rem" }}>
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", gap: 16, alignItems: "center", background: "#f8fafc", padding: "6px 12px", borderRadius: 999 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", fontWeight: 700, fontSize: "0.9rem" }}>
                      <span>💬</span> {post.replies_count || 0}
                    </div>
                    <div 
                      onClick={(e) => { e.stopPropagation(); likePost(post.post_id); }}
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 6, 
                        fontWeight: 700, 
                        fontSize: "0.9rem",
                        color: userLikedPosts.has(post.post_id) ? "#ef4444" : "#64748b",
                        cursor: "pointer",
                        transition: "transform 0.1s",
                        transform: liking[post.post_id] ? "scale(1.2)" : "scale(1)"
                      }}
                    >
                      <span>❤️</span> {postLikeCounts[post.post_id] || 0}
                    </div>
                  </div>
                </div>
                
                <h3 style={{ fontSize: "1.4rem", margin: "0 0 8px 0", color: "#0f172a" }}>{post.title}</h3>
                <p style={{ margin: 0, color: "#475569", fontSize: "1.05rem", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {post.body}
                </p>
              </article>
            )) : (
              <div style={{ textAlign: "center", padding: "60px 20px", background: "#f8fafc", borderRadius: 24, border: "2px dashed #e2e8f0" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
                <h3 style={{ margin: "0 0 8px 0", color: "#0f172a" }}>No Discussions Yet</h3>
                <p className="muted" style={{ fontSize: "1.1rem" }}>Be the first to start a conversation in this community!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Forum;
