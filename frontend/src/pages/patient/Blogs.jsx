import { useEffect, useState } from "react";

import { blogApi } from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";

const Blogs = () => {
  const user = getStoredUser();
  const [feed, setFeed] = useState([]);
  const [pending, setPending] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [mode, setMode] = useState("feed");
  const [form, setForm] = useState({ title: "", body: "", category: "" });
  const [commentText, setCommentText] = useState({});
  const [userLikedArticles, setUserLikedArticles] = useState(new Set());
  const [liking, setLiking] = useState({});
  const [notice, setNotice] = useState("");

  const appendCommentToArticle = (articles, articleId, comment) =>
    articles.map((article) => {
      if (article.article_id !== articleId) return article;

      const currentComments = Array.isArray(article.comments) ? article.comments : [];
      return {
        ...article,
        comments: [...currentComments, comment],
        comments_count: Number(article.comments_count || currentComments.length) + 1,
      };
    });

  const hydrateArticlesWithComments = async (articles) => {
    const articleList = Array.isArray(articles) ? articles : [];
    if (!articleList.length) return articleList;

    const details = await Promise.all(
      articleList.map(async (article) => {
        try {
          const response = await blogApi.getArticle(article.article_id, user.id);
          const comments = Array.isArray(response.data?.comments) ? response.data.comments : [];
          return {
            ...article,
            comments,
            comments_count: comments.length,
          };
        } catch (error) {
          console.error(error);
          return article;
        }
      })
    );

    return details;
  };

  const load = async () => {
    try {
      const [feedResponse, pendingResponse, bookmarksResponse] = await Promise.all([
        blogApi.feed(user.id),
        blogApi.pending(user.id),
        blogApi.bookmarks(user.id)
      ]);

      const [feedArticles, pendingArticles, bookmarkedArticles] = await Promise.all([
        hydrateArticlesWithComments(feedResponse.data || []),
        hydrateArticlesWithComments(pendingResponse.data || []),
        hydrateArticlesWithComments(bookmarksResponse.data || []),
      ]);

      setFeed(feedArticles);
      setPending(pendingArticles);
      setBookmarks(bookmarkedArticles);
      setNotice("");

      // Build set of articles already liked by this user
      const likedIds = new Set();
      const allArticles = [...feedArticles, ...pendingArticles, ...bookmarkedArticles];
      allArticles.forEach(article => {
        if (article.user_has_liked) {
          likedIds.add(article.article_id);
        }
      });
      setUserLikedArticles(likedIds);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
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
        status: "hidden",
      });
      setForm({ title: "", body: "", category: "" });
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
      }
    } finally {
      setLiking((prev) => ({ ...prev, [articleId]: false }));
    }
  };

  const commentArticle = async (articleId) => {
    const body = commentText[articleId]?.trim();
    if (!body) return;
    try {
      const response = await blogApi.comment({ article_id: articleId, user_id: user.id, body });
      const savedComment = {
        comment_id: `temp-${Date.now()}`,
        article_id: articleId,
        user_id: user.id,
        body,
        commenter_name: user.name || "You",
        created_at: new Date().toISOString(),
        ...(response.data?.comment || {}),
      };

      setCommentText((current) => ({ ...current, [articleId]: "" }));
      setFeed((current) => appendCommentToArticle(current, articleId, savedComment));
      setPending((current) => appendCommentToArticle(current, articleId, savedComment));
      setBookmarks((current) => appendCommentToArticle(current, articleId, savedComment));
      setNotice("Comment added.");
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

  const items = mode === "bookmarks" ? bookmarks : feed;

  return (
    <>
      <section className="panel">
        <p className="eyebrow">Patient Portal</p>
        <h2 style={{ marginTop: 4 }}>Health Blogs</h2>
        <p className="muted">
          Read published health articles and tips from our doctors, then like or comment on active posts.
        </p>
      </section>

      {notice && <p className="alert alert-success" style={{ margin: "24px 0 0 0" }}>{notice}</p>}

      <section style={{ display: "flex", flexDirection: "column", gap: 32, marginTop: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "16px 24px", borderRadius: 20, border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: 0, fontSize: "1.5rem", color: "#0f172a" }}>Feed</h3>
            <div className="inline-actions" style={{ gap: 8 }}>
              <button className={mode === "feed" ? "btn-main small" : "btn-soft small"} onClick={() => setMode("feed")} style={{ borderRadius: 999 }}>Active</button>
              <button className={mode === "bookmarks" ? "btn-main small" : "btn-soft small"} onClick={() => setMode("bookmarks")} style={{ borderRadius: 999 }}>Bookmarks ({bookmarks.length})</button>
            </div>
          </div>

          <div className="blog-carousel" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
            {items.length ? items.map((article) => {
              const articleComments = Array.isArray(article.comments) ? article.comments : [];

              return (
              <div key={article.article_id} className="blog-card" style={{ padding: 24, margin: 0, width: "100%", boxSizing: "border-box" }}>
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

                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <strong style={{ color: "#0f172a", fontSize: "0.95rem" }}>Comments</strong>
                    <span className="muted" style={{ fontSize: "0.85rem" }}>{article.comments_count || articleComments.length}</span>
                  </div>
                  {articleComments.length ? (
                    <div style={{ display: "grid", gap: 10, maxHeight: 180, overflowY: "auto", paddingRight: 4 }}>
                      {articleComments.map((comment) => (
                        <div key={comment.comment_id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                            <strong style={{ color: "#334155", fontSize: "0.9rem" }}>{comment.commenter_name || "Reader"}</strong>
                            <span className="muted" style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                              {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : ""}
                            </span>
                          </div>
                          <p style={{ color: "#475569", margin: 0, lineHeight: 1.5, fontSize: "0.92rem", whiteSpace: "pre-wrap" }}>{comment.body}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>No comments yet.</p>
                  )}
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
              );
            }) : <div style={{ padding: 40, textAlign: "center", background: "#fff", borderRadius: 20, border: "1px dashed #cbd5e1", gridColumn: "1 / -1" }}><p className="muted" style={{ margin: 0, fontSize: "1.1rem" }}>No articles found in this section.</p></div>}
          </div>
        </div>
      </section>
    </>
  );
};

export default Blogs;