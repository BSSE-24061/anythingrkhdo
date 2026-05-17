import { useEffect, useState } from "react";
<<<<<<< HEAD

import { blogApi } from "../../utils/apiHelper";
=======
import { blogApi, getErrorMessage } from "../../utils/apiHelper";
>>>>>>> parent of 42a0ed9 (push)
import { getStoredUser } from "../../utils/session";

const Blogs = () => {
  const user = getStoredUser();
  const [feed, setFeed] = useState([]);
<<<<<<< HEAD
  const [pending, setPending] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [mode, setMode] = useState("feed");
  const [form, setForm] = useState({ title: "", body: "", category: "", cover_image: "" });
  const [commentText, setCommentText] = useState({});
  const [userLikedArticles, setUserLikedArticles] = useState(new Set());
  const [liking, setLiking] = useState({});
  const [notice, setNotice] = useState("");

  const load = async () => {
    try {
      const [feedResponse, pendingResponse, bookmarksResponse] = await Promise.all([
        blogApi.feed(user.id),
        blogApi.pending(user.id),
        blogApi.bookmarks(user.id)
      ]);
      setFeed(feedResponse.data || []);
      setPending(pendingResponse.data || []);
      setBookmarks(bookmarksResponse.data || []);
      setNotice("");

      // Build set of articles already liked by this user
      const likedIds = new Set();
      const allArticles = [...(feedResponse.data || []), ...(pendingResponse.data || []), ...(bookmarksResponse.data || [])];
      allArticles.forEach(article => {
=======
  const [bookmarks, setBookmarks] = useState([]);
  const [mode, setMode] = useState("feed");
  const [commentText, setCommentText] = useState({});
  const [userLikedArticles, setUserLikedArticles] = useState(new Set());
  const [liking, setLiking] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [feedResponse, bookmarksResponse] = await Promise.all([
        blogApi.feed(),
        blogApi.bookmarks(user.id)
      ]);

      const activeFeed = feedResponse.data || [];
      setFeed(activeFeed);
      setBookmarks(bookmarksResponse.data || []);

      const likedIds = new Set();
      // In a real app, the API would return user_has_liked
      // For now we check the feed data
      activeFeed.forEach(article => {
>>>>>>> parent of 42a0ed9 (push)
        if (article.user_has_liked) {
          likedIds.add(article.article_id);
        }
      });
      setUserLikedArticles(likedIds);
<<<<<<< HEAD
    } catch (error) {
      console.error(error);
=======
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load blog feed."));
    } finally {
      setLoading(false);
>>>>>>> parent of 42a0ed9 (push)
    }
  };

  useEffect(() => {
<<<<<<< HEAD
    load();
  }, []);

  const createArticle = async (event) => {
    event.preventDefault();
    try {
      await blogApi.create({
        author_user_id: user.id,
        title: form.title,
        body: form.body,
        category: form.category,
        cover_image: form.cover_image,
        status: "hidden",
      });
      setForm({ title: "", body: "", category: "", cover_image: "" });
      load();
    } catch (error) {
      console.error(error);
    }
  };

  const likeArticle = async (articleId) => {
    if (userLikedArticles.has(articleId)) {
      setNotice("You already liked this article.");
      return;
    }
    if (liking[articleId]) return;

    setLiking((prev) => ({ ...prev, [articleId]: true }));

    try {
      await blogApi.like({ article_id: articleId, user_id: user.id });
      setUserLikedArticles((prev) => new Set(prev).add(articleId));
      setNotice("Thanks for liking this article.");
      load();
    } catch (error) {
      console.error(error);
      const message = error?.response?.data?.error || error?.message || "Unable to like article.";
      if (message.toLowerCase().includes("already")) {
        setUserLikedArticles((prev) => new Set(prev).add(articleId));
        setNotice("You already liked this article.");
=======
    loadData();
  }, []);

  const likeArticle = async (articleId) => {
    if (userLikedArticles.has(articleId) || liking[articleId]) return;

    setLiking((prev) => ({ ...prev, [articleId]: true }));
    try {
      await blogApi.like({ article_id: articleId, user_id: user.id });
      setUserLikedArticles((prev) => new Set(prev).add(articleId));
      // Optionally refresh to get new like counts
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 400) {
        setUserLikedArticles((prev) => new Set(prev).add(articleId));
>>>>>>> parent of 42a0ed9 (push)
      }
    } finally {
      setLiking((prev) => ({ ...prev, [articleId]: false }));
    }
  };

<<<<<<< HEAD
=======
  const bookmarkArticle = async (articleId) => {
    try {
      await blogApi.bookmark({ article_id: articleId, user_id: user.id });
      alert("Added to your bookmarks!");
      loadData();
    } catch (err) {
      if (err?.response?.status === 400) {
        alert("Already in your bookmarks.");
      }
    }
  };

>>>>>>> parent of 42a0ed9 (push)
  const commentArticle = async (articleId) => {
    const body = commentText[articleId];
    if (!body) return;
    try {
      await blogApi.comment({ article_id: articleId, user_id: user.id, body });
      setCommentText((current) => ({ ...current, [articleId]: "" }));
<<<<<<< HEAD
      load();
    } catch (error) {
      console.error(error);
    }
  };

  const bookmarkArticle = async (articleId) => {
    try {
      await blogApi.bookmark({ article_id: articleId, user_id: user.id });
      alert("Article bookmarked successfully!");
      load();
    } catch (error) {
      console.error(error);
      if (error?.response?.status === 400) {
        alert("You already bookmarked this article");
      } else {
        alert("Error bookmarking article");
      }
    }
  };

  const items = mode === "pending" ? pending : mode === "bookmarks" ? bookmarks : feed;

  return (
    <>
      <section className="panel">
        <p className="eyebrow">{user?.role ? `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Portal` : "Health Portal"}</p>
        <h2 style={{ marginTop: 4 }}>Manage Blogs</h2>
        <p className="muted">
          Publish blog drafts for admin approval, then like or comment on active posts.
        </p>
      </section>

      {notice && <p className="alert alert-success" style={{ margin: "24px 0 0 0" }}>{notice}</p>}

      <section className="grid-layout two-col" style={{ gap: 32 }}>
        <div style={{ background: "#fff", borderRadius: 24, padding: 32, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", height: "fit-content" }}>
          <div className="section-heading" style={{ marginBottom: 24 }}><h3 style={{ fontSize: "1.5rem", color: "#0f172a", margin: 0 }}>Create Article</h3></div>
          <form className="form-grid" onSubmit={createArticle}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <input style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #cbd5e1", outline: "none" }} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Title" required />
              <input style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #cbd5e1", outline: "none" }} value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Category" />
              <input style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #cbd5e1", outline: "none" }} value={form.cover_image} onChange={(event) => setForm((current) => ({ ...current, cover_image: event.target.value }))} placeholder="Cover image URL" />
              <textarea style={{ padding: "16px", borderRadius: 12, border: "1px solid #cbd5e1", outline: "none", resize: "vertical" }} rows="8" value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} placeholder="Write your article..." required />
              <button type="submit" className="btn-main" style={{ padding: "14px", borderRadius: 12, marginTop: 8 }}>Submit for Approval</button>
            </div>
          </form>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "16px 24px", borderRadius: 20, border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: 0, fontSize: "1.5rem", color: "#0f172a" }}>Feed</h3>
            <div className="inline-actions" style={{ gap: 8 }}>
              <button className={mode === "feed" ? "btn-main small" : "btn-soft small"} onClick={() => setMode("feed")} style={{ borderRadius: 999 }}>Active</button>
              <button className={mode === "pending" ? "btn-main small" : "btn-soft small"} onClick={() => setMode("pending")} style={{ borderRadius: 999 }}>Pending</button>
              <button className={mode === "bookmarks" ? "btn-main small" : "btn-soft small"} onClick={() => setMode("bookmarks")} style={{ borderRadius: 999 }}>Bookmarks ({bookmarks.length})</button>
            </div>
          </div>

          <div className="blog-carousel">
            {items.length ? items.map((article) => (
              <div key={article.article_id} className="blog-card" style={{ padding: 24, minWidth: 340, maxWidth: 420 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
                  <h4 style={{ margin: 0, fontSize: "1.3rem", color: "#0f172a" }}>{article.title}</h4>
                  <span style={{ background: "#f1f5f9", padding: "4px 10px", borderRadius: 6, fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>
                    By {article.author_name || article.author_user_id}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <p style={{ color: "#475569", lineHeight: 1.6, fontSize: "1.05rem", margin: 0, flex: 1 }}>{article.body}</p>
                  <div style={{ marginLeft: 16, padding: "6px 12px", borderRadius: 999, background: "#eef2ff", color: "#4338ca", fontWeight: 700, fontSize: "0.85rem" }}>
                    ❤️ {article.likes_count || 0}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                  <button
                    onClick={() => likeArticle(article.article_id)}
                    disabled={userLikedArticles.has(article.article_id) || liking[article.article_id]}
                    style={{
                      padding: "8px 16px", borderRadius: 10, border: "none", fontWeight: 700,
                      background: userLikedArticles.has(article.article_id) ? "#fef2f2" : "#f1f5f9",
                      color: userLikedArticles.has(article.article_id) ? "#ef4444" : "#64748b",
                      opacity: liking[article.article_id] ? 0.6 : 1,
                      cursor: (userLikedArticles.has(article.article_id) || liking[article.article_id]) ? "not-allowed" : "pointer"
                    }}
                  >
                    {liking[article.article_id] ? "Liking..." : (userLikedArticles.has(article.article_id) ? "❤️ Liked" : "🤍 Like")}
                  </button>
                  <button
                    onClick={() => bookmarkArticle(article.article_id)}
                    style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "#f1f5f9", color: "#64748b", fontWeight: 700, cursor: "pointer" }}
                  >
                    🔖 Bookmark
                  </button>
                </div>

                <div style={{ display: "flex", gap: 12, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                  <input
                    style={{ flex: 1, padding: "10px 16px", borderRadius: 12, border: "1px solid #cbd5e1", outline: "none", background: "#f8fafc" }}
                    value={commentText[article.article_id] || ""}
                    onChange={(event) => setCommentText((current) => ({ ...current, [article.article_id]: event.target.value }))}
                    placeholder="Write a comment..."
                  />
                  <button className="btn-main" onClick={() => commentArticle(article.article_id)} style={{ borderRadius: 12, padding: "0 24px" }}>Post</button>
                </div>
              </div>
            )) : <div style={{ padding: 40, textAlign: "center", background: "#fff", borderRadius: 20, border: "1px dashed #cbd5e1" }}><p className="muted" style={{ margin: 0, fontSize: "1.1rem" }}>No articles found in this section.</p></div>}
          </div>
        </div>
      </section>
    </>
  );
};

export default Blogs;
=======
      alert("Comment posted!");
      // Optionally reload to show new comments if the UI supported it
    } catch (err) {
      alert("Failed to post comment.");
    }
  };

  const displayedArticles = mode === "bookmarks" ? bookmarks : feed;

  return (
    <div className="page-shell">
      <section className="hero-panel" style={{ background: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)" }}>
        <div>
          <h1 className="eyebrow" style={{ color: "#0369a1" }}>Knowledge Base</h1>
          <h2 style={{ color: "#0c4a6e" }}>Medical Insights</h2>
          <p className="muted" style={{ color: "#075985" }}>
            Trustworthy healthcare information from our medical professionals.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, alignSelf: "end", marginBottom: 8 }}>
          <button
            className={mode === "feed" ? "btn-main" : "btn-ghost"}
            onClick={() => setMode("feed")}
          >
            Latest Feed
          </button>
          <button
            className={mode === "bookmarks" ? "btn-main" : "btn-ghost"}
            onClick={() => setMode("bookmarks")}
          >
            My Bookmarks ({bookmarks.length})
          </button>
        </div>
      </section>

      {error && <p className="error-banner">{error}</p>}

      <div className="grid-layout" style={{ gridTemplateColumns: "1fr", gap: 24 }}>
        {loading ? (
          <p className="muted" style={{ textAlign: "center", padding: 40 }}>Loading insightful articles...</p>
        ) : (
          <div className="list-stack">
            {displayedArticles.length ? displayedArticles.map((article) => (
              <article key={article.article_id} className="panel" style={{ padding: 32 }}>
                <div style={{ display: "flex", gap: 32, alignItems: "start" }}>
                  {article.cover_image && (
                    <img
                      src={article.cover_image}
                      alt={article.title}
                      style={{ width: 240, height: 160, objectFit: "cover", borderRadius: 16, border: "1.5px solid var(--line)" }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <span className="status-pill status-open" style={{ marginBottom: 12, background: "rgba(3, 105, 161, 0.1)", color: "#0369a1", borderColor: "rgba(3, 105, 161, 0.2)" }}>
                        {article.category || "Health"}
                      </span>
                      <small className="muted">{new Date(article.created_at).toLocaleDateString()}</small>
                    </div>
                    <h3 style={{ fontSize: "1.8rem", margin: "0 0 16px 0" }}>{article.title}</h3>
                    <p style={{ fontSize: "1.1rem", lineHeight: 1.6, color: "var(--text)", marginBottom: 24 }}>
                      {article.body}
                    </p>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 20, borderTop: "1.5px solid var(--line)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 999, background: "var(--accent)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 12 }}>Dr</div>
                        <span style={{ fontWeight: 700 }}>{article.author_name || "Medical Expert"}</span>
                      </div>
                      <div className="inline-actions">
                        <button
                          className="btn-ghost small"
                          onClick={() => likeArticle(article.article_id)}
                          disabled={userLikedArticles.has(article.article_id) || liking[article.article_id]}
                        >
                          {liking[article.article_id] ? "..." : (userLikedArticles.has(article.article_id) ? "❤️ Liked" : "🤍 Like")}
                        </button>
                        <button className="btn-ghost small" onClick={() => bookmarkArticle(article.article_id)}>🔖 Bookmark</button>
                      </div>
                    </div>

                    <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
                      <input
                        style={{ flex: 1, borderRadius: 12, padding: "8px 16px", border: "1.5px solid var(--line)" }}
                        value={commentText[article.article_id] || ""}
                        onChange={(e) => setCommentText(c => ({ ...c, [article.article_id]: e.target.value }))}
                        placeholder="Join the discussion..."
                      />
                      <button className="btn-main small" onClick={() => commentArticle(article.article_id)}>Post</button>
                    </div>
                  </div>
                </div>
              </article>
            )) : (
              <div className="panel" style={{ textAlign: "center", padding: 60 }}>
                <p className="muted" style={{ fontSize: "1.2rem" }}>
                  {mode === "bookmarks" ? "You haven't bookmarked any articles yet." : "No articles published in this category yet."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blogs;
>>>>>>> parent of 42a0ed9 (push)
