import { useEffect, useState } from "react";
import { blogApi, getErrorMessage } from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";

const Blogs = () => {
  const user = getStoredUser();
  const [feed, setFeed] = useState([]);
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
        if (article.user_has_liked) {
          likedIds.add(article.article_id);
        }
      });
      setUserLikedArticles(likedIds);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load blog feed."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
      }
    } finally {
      setLiking((prev) => ({ ...prev, [articleId]: false }));
    }
  };

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

  const commentArticle = async (articleId) => {
    const body = commentText[articleId];
    if (!body) return;
    try {
      await blogApi.comment({ article_id: articleId, user_id: user.id, body });
      setCommentText((current) => ({ ...current, [articleId]: "" }));
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
