import { useEffect, useState } from "react";

import { blogApi } from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";

const Blogs = () => {
  const user = getStoredUser();
  const [feed, setFeed] = useState([]);
  const [pending, setPending] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [mode, setMode] = useState("feed");
  const [form, setForm] = useState({ title: "", body: "", category: "", cover_image: "" });
  const [commentText, setCommentText] = useState({});
  const [userLikedArticles, setUserLikedArticles] = useState(new Set());
  const [liking, setLiking] = useState({});

  const load = async () => {
    try {
      const [feedResponse, pendingResponse, bookmarksResponse] = await Promise.all([
        blogApi.feed(), 
        blogApi.pending(),
        blogApi.bookmarks(user.id)
      ]);
      setFeed(feedResponse.data || []);
      setPending(pendingResponse.data || []);
      setBookmarks(bookmarksResponse.data || []);
      
      // Build set of articles already liked by this user
      const likedIds = new Set();
      const allArticles = [...(feedResponse.data || []), ...(pendingResponse.data || []), ...(bookmarksResponse.data || [])];
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
    // Prevent double-like
    if (userLikedArticles.has(articleId) || liking[articleId]) {
      return;
    }

    setLiking((prev) => ({ ...prev, [articleId]: true }));

    try {
      await blogApi.like({ article_id: articleId, user_id: user.id });
      setUserLikedArticles((prev) => new Set(prev).add(articleId));
      load();
    } catch (error) {
      console.error(error);
      // Check if error is duplicate like
      if (error?.response?.status === 400 || error?.message?.toLowerCase().includes("already")) {
        setUserLikedArticles((prev) => new Set(prev).add(articleId));
      }
    } finally {
      setLiking((prev) => ({ ...prev, [articleId]: false }));
    }
  };

  const commentArticle = async (articleId) => {
    const body = commentText[articleId];
    if (!body) return;
    try {
      await blogApi.comment({ article_id: articleId, user_id: user.id, body });
      setCommentText((current) => ({ ...current, [articleId]: "" }));
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
      <section className="page-heading">
        <div>
          <h1>Blogs</h1>
          <p className="muted">Publish blog drafts for admin approval, then like or comment on active posts.</p>
        </div>
      </section>

      <section className="grid-layout two-col">
        <div className="card">
          <div className="section-heading"><h3>Create Article</h3></div>
          <form className="form-grid" onSubmit={createArticle}>
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Title" required />
            <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Category" />
            <input value={form.cover_image} onChange={(event) => setForm((current) => ({ ...current, cover_image: event.target.value }))} placeholder="Cover image URL" />
            <textarea rows="8" value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} placeholder="Write your article..." required />
            <button type="submit" className="btn-main">Submit for Approval</button>
          </form>
        </div>

        <div className="card">
          <div className="section-heading">
            <h3>Feed</h3>
            <div className="inline-actions">
              <button className={mode === "feed" ? "btn-main small" : "btn-soft small"} onClick={() => setMode("feed")}>Active</button>
              <button className={mode === "pending" ? "btn-main small" : "btn-soft small"} onClick={() => setMode("pending")}>Pending</button>
              <button className={mode === "bookmarks" ? "btn-main small" : "btn-soft small"} onClick={() => setMode("bookmarks")}>Bookmarks ({bookmarks.length})</button>
            </div>
          </div>

          <div className="list-stack">
            {items.length ? items.map((article) => (
              <div className="list-item" key={article.article_id}>
                <strong>{article.title}</strong>
                <span>{article.author_name || article.author_user_id}</span>
                <p>{article.body}</p>
                <div className="inline-actions wrap">
                  <button 
                    className="btn-soft small" 
                    onClick={() => likeArticle(article.article_id)}
                    disabled={userLikedArticles.has(article.article_id) || liking[article.article_id]}
                    style={{ 
                      opacity: (userLikedArticles.has(article.article_id) || liking[article.article_id]) ? 0.6 : 1,
                      cursor: (userLikedArticles.has(article.article_id) || liking[article.article_id]) ? "not-allowed" : "pointer"
                    }}
                  >
                    {liking[article.article_id] ? "Liking..." : (userLikedArticles.has(article.article_id) ? "✓ Liked" : "Like")}
                  </button>
                  <button className="btn-soft small" onClick={() => bookmarkArticle(article.article_id)}>Bookmark</button>
                </div>

                <div className="inline-actions wrap">
                  <input
                    style={{ flex: 1 }}
                    value={commentText[article.article_id] || ""}
                    onChange={(event) => setCommentText((current) => ({ ...current, [article.article_id]: event.target.value }))}
                    placeholder="Write a comment"
                  />
                  <button className="btn-main small" onClick={() => commentArticle(article.article_id)}>Comment</button>
                </div>
              </div>
            )) : <p className="muted">No articles found.</p>}
          </div>
        </div>
      </section>
    </>
  );
};

export default Blogs;