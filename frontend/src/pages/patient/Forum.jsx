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
