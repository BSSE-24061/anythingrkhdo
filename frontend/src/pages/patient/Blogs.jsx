import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { blogApi, getErrorMessage } from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";

const Blogs = () => {
  const user = getStoredUser();
  const [feed, setFeed] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [mode, setMode] = useState("feed");
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

  const displayedArticles = mode === "bookmarks" ? bookmarks : feed;

  return (
    <div className="page-shell">
      <section className="hero-panel" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#fff", borderRadius: 24, padding: "48px 40px" }}>
        <div>
          <h1 className="eyebrow" style={{ color: "#38bdf8", letterSpacing: "0.15em", textTransform: "uppercase" }}>Knowledge Base</h1>
          <h2 style={{ color: "#f8fafc", fontSize: "3rem", margin: "12px 0", letterSpacing: "-0.03em" }}>Medical Insights</h2>
          <p style={{ color: "#94a3b8", fontSize: "1.2rem", maxWidth: 600, lineHeight: 1.6 }}>
            Trustworthy healthcare information, latest research, and wellness tips straight from our medical professionals.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, alignSelf: "end", marginTop: 24 }}>
          <button 
            className={mode === "feed" ? "btn-main" : "btn-ghost"} 
            onClick={() => setMode("feed")}
            style={mode !== "feed" ? { color: "#fff", borderColor: "rgba(255,255,255,0.2)" } : {}}
          >
            Latest Feed
          </button>
          <button 
            className={mode === "bookmarks" ? "btn-main" : "btn-ghost"} 
            onClick={() => setMode("bookmarks")}
            style={mode !== "bookmarks" ? { color: "#fff", borderColor: "rgba(255,255,255,0.2)" } : {}}
          >
            My Bookmarks ({bookmarks.length})
          </button>
        </div>
      </section>

      {error && <p className="error-banner" style={{ margin: "24px 0" }}>{error}</p>}

      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }}></div>
          <p className="muted" style={{ marginTop: 16 }}>Curating articles for you...</p>
        </div>
      ) : (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", 
          gap: 32, 
          marginTop: 32 
        }}>
          {displayedArticles.length ? displayedArticles.map((article) => (
            <article 
              key={article.article_id} 
              style={{ 
                background: "#fff", 
                borderRadius: 24, 
                border: "1px solid #e2e8f0", 
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)";
              }}
            >
              <div style={{ height: 200, background: "#f1f5f9", position: "relative" }}>
                {article.cover_image ? (
                  <img 
                    src={article.cover_image} 
                    alt={article.title} 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontSize: 48, background: "linear-gradient(45deg, #f8fafc, #e2e8f0)" }}>
                    📰
                  </div>
                )}
                <div style={{ position: "absolute", top: 16, left: 16 }}>
                  <span style={{ 
                    background: "rgba(255,255,255,0.9)", 
                    backdropFilter: "blur(4px)",
                    color: "#0f172a", 
                    padding: "6px 12px", 
                    borderRadius: 999, 
                    fontSize: 12, 
                    fontWeight: 800,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}>
                    {article.category || "Health"}
                  </span>
                </div>
              </div>
              
              <div style={{ padding: 24, display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>
                    {new Date(article.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 13, fontWeight: 700 }}>
                    <span>❤️ {article.likes_count || 0}</span>
                  </div>
                </div>
                
                <h3 style={{ fontSize: "1.4rem", margin: "0 0 12px 0", lineHeight: 1.3, color: "#0f172a" }}>
                  <Link to={`/blogs/${article.article_id}`} style={{ color: "inherit", textDecoration: "none" }}>
                    {article.title}
                  </Link>
                </h3>
                
                <p style={{ fontSize: "1rem", lineHeight: 1.6, color: "#475569", marginBottom: 24, flex: 1 }}>
                  {article.body.substring(0, 120)}...
                </p>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 20, borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#3b82f6", color: "#fff", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 11 }}>Dr</div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{article.author_name || "Expert"}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button 
                      onClick={() => likeArticle(article.article_id)}
                      disabled={userLikedArticles.has(article.article_id) || liking[article.article_id]}
                      style={{
                        background: "none", border: "none", cursor: "pointer", padding: "8px", borderRadius: "50%",
                        backgroundColor: userLikedArticles.has(article.article_id) ? "#fef2f2" : "#f1f5f9",
                        color: userLikedArticles.has(article.article_id) ? "#ef4444" : "#64748b",
                        transition: "all 0.2s"
                      }}
                      title="Like"
                    >
                      ❤️
                    </button>
                    <button 
                      onClick={() => bookmarkArticle(article.article_id)}
                      style={{
                        background: "#f1f5f9", border: "none", cursor: "pointer", padding: "8px", borderRadius: "50%",
                        color: "#64748b", transition: "all 0.2s"
                      }}
                      title="Bookmark"
                    >
                      🔖
                    </button>
                  </div>
                </div>
              </div>
            </article>
          )) : (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "80px 20px", background: "#f8fafc", borderRadius: 24, border: "2px dashed #e2e8f0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <h3 style={{ margin: "0 0 8px 0", color: "#0f172a" }}>No Articles Found</h3>
              <p className="muted" style={{ fontSize: "1.1rem", margin: 0 }}>
                {mode === "bookmarks" ? "You haven't bookmarked any articles yet. Discover amazing content in the Latest Feed!" : "No articles published in this category yet. Check back later."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Blogs;
