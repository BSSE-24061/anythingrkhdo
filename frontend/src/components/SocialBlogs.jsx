import { useEffect, useMemo, useState } from "react";
import { Bookmark, Heart, MessageCircle, Plus, X } from "lucide-react";

import { blogApi } from "../utils/apiHelper";
import { getStoredUser } from "../utils/session";

const emptyForm = { title: "", body: "", category: "" };

const getExcerpt = (text = "", limit = 180) => {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trim()}...`;
};

const SocialBlogs = ({ canCreate = false, title = "Health Blogs" }) => {
  const user = getStoredUser();
  const [feed, setFeed] = useState([]);
  const [pending, setPending] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [mode, setMode] = useState("feed");
  const [form, setForm] = useState(emptyForm);
  const [commentText, setCommentText] = useState({});
  const [likedArticles, setLikedArticles] = useState(new Set());
  const [liking, setLiking] = useState({});
  const [notice, setNotice] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const appendCommentToArticle = (articles, articleId, comment) =>
    articles.map((article) => {
      if (article.article_id !== articleId) return article;
      const currentComments = Array.isArray(article.comments)
        ? article.comments
        : [];

      return {
        ...article,
        comments: [...currentComments, comment],
        comments_count: Number(article.comments_count || currentComments.length) + 1,
      };
    });

  const hydrateArticlesWithComments = async (articles) => {
    const articleList = Array.isArray(articles) ? articles : [];
    if (!articleList.length) return articleList;

    return Promise.all(
      articleList.map(async (article) => {
        try {
          const response = await blogApi.getArticle(article.article_id, user.id);
          const comments = Array.isArray(response.data?.comments)
            ? response.data.comments
            : [];
          return {
            ...article,
            comments,
            comments_count: comments.length,
            user_has_liked: response.data?.article?.user_has_liked ?? article.user_has_liked,
          };
        } catch (error) {
          console.error(error);
          return article;
        }
      }),
    );
  };

  const load = async () => {
    if (!user?.id) return;

    try {
      const requests = [
        blogApi.feed(user.id),
        canCreate ? blogApi.pending(user.id) : Promise.resolve({ data: [] }),
        blogApi.bookmarks(user.id),
      ];
      const [feedResponse, pendingResponse, bookmarksResponse] =
        await Promise.all(requests);

      const [feedArticles, pendingArticles, bookmarkedArticles] =
        await Promise.all([
          hydrateArticlesWithComments(feedResponse.data || []),
          hydrateArticlesWithComments(pendingResponse.data || []),
          hydrateArticlesWithComments(bookmarksResponse.data || []),
        ]);

      setFeed(feedArticles);
      setPending(pendingArticles);
      setBookmarks(bookmarkedArticles);

      const likedIds = new Set();
      [...feedArticles, ...pendingArticles, ...bookmarkedArticles].forEach(
        (article) => {
          if (article.user_has_liked) likedIds.add(article.article_id);
        },
      );
      setLikedArticles(likedIds);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const items = useMemo(() => {
    if (mode === "bookmarks") return bookmarks;
    if (mode === "pending") return pending;
    return feed;
  }, [bookmarks, feed, mode, pending]);

  const syncArticle = (articleId, updater) => {
    setFeed((current) =>
      current.map((article) =>
        article.article_id === articleId ? updater(article) : article,
      ),
    );
    setPending((current) =>
      current.map((article) =>
        article.article_id === articleId ? updater(article) : article,
      ),
    );
    setBookmarks((current) =>
      current.map((article) =>
        article.article_id === articleId ? updater(article) : article,
      ),
    );
    setSelectedArticle((current) =>
      current?.article_id === articleId ? updater(current) : current,
    );
  };

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
      setForm(emptyForm);
      setComposerOpen(false);
      setMode("pending");
      setNotice("Blog submitted for admin approval.");
      load();
    } catch (error) {
      console.error(error);
    }
  };

  const likeArticle = async (articleId) => {
    if (likedArticles.has(articleId) || liking[articleId]) {
      setNotice("You already liked this article.");
      return;
    }

    setLiking((prev) => ({ ...prev, [articleId]: true }));
    try {
      await blogApi.like({ article_id: articleId, user_id: user.id });
      setLikedArticles((prev) => new Set(prev).add(articleId));
      syncArticle(articleId, (article) => ({
        ...article,
        likes_count: Number(article.likes_count || 0) + 1,
        user_has_liked: true,
      }));
      setNotice("Thanks for liking this article.");
    } catch (error) {
      const message =
        error?.response?.data?.error || error?.message || "Unable to like article.";
      if (message.toLowerCase().includes("already")) {
        setLikedArticles((prev) => new Set(prev).add(articleId));
        setNotice("You already liked this article.");
      }
      console.error(error);
    } finally {
      setLiking((prev) => ({ ...prev, [articleId]: false }));
    }
  };

  const commentArticle = async (articleId) => {
    const body = commentText[articleId]?.trim();
    if (!body) return;

    try {
      const response = await blogApi.comment({
        article_id: articleId,
        user_id: user.id,
        body,
      });
      const savedComment = {
        comment_id: `temp-${Date.now()}`,
        article_id: articleId,
        user_id: user.id,
        body,
        commenter_name: user.name || user.full_name || "You",
        created_at: new Date().toISOString(),
        ...(response.data?.comment || {}),
      };

      setCommentText((current) => ({ ...current, [articleId]: "" }));
      setFeed((current) => appendCommentToArticle(current, articleId, savedComment));
      setPending((current) =>
        appendCommentToArticle(current, articleId, savedComment),
      );
      setBookmarks((current) =>
        appendCommentToArticle(current, articleId, savedComment),
      );
      setSelectedArticle((current) => {
        if (!current || current.article_id !== articleId) return current;
        const currentComments = Array.isArray(current.comments)
          ? current.comments
          : [];
        return {
          ...current,
          comments: [...currentComments, savedComment],
          comments_count:
            Number(current.comments_count || currentComments.length) + 1,
        };
      });
      setNotice("Comment added.");
    } catch (error) {
      console.error(error);
    }
  };

  const bookmarkArticle = async (articleId) => {
    try {
      await blogApi.bookmark({ article_id: articleId, user_id: user.id });
      setNotice("Article bookmarked.");
      load();
    } catch (error) {
      const alreadySaved = error?.response?.status === 400;
      setNotice(alreadySaved ? "You already bookmarked this article." : "Error bookmarking article.");
      console.error(error);
    }
  };

  const tabs = [
    { key: "feed", label: "Active", count: feed.length },
    ...(canCreate ? [{ key: "pending", label: "Pending", count: pending.length }] : []),
    { key: "bookmarks", label: "Bookmarks", count: bookmarks.length },
  ];

  return (
    <div className="content-page social-page">
      <section className="panel social-header">
        <div>
          <p className="eyebrow">{user?.role === "doctor" ? "Doctor Portal" : "Patient Portal"}</p>
          <h2>{title}</h2>
          <p className="muted">
            Browse doctor-written articles. Open any blog to read, comment, like, or bookmark.
          </p>
        </div>
        {canCreate && (
          <button className="btn-main" type="button" onClick={() => setComposerOpen(true)}>
            <Plus size={18} />
            Add Blog
          </button>
        )}
      </section>

      {notice && <p className="alert alert-success">{notice}</p>}

      <section className="panel">
        <div className="social-toolbar">
          <h3>Blog Library</h3>
          <div className="inline-actions wrap">
            {tabs.map((tab) => (
              <button
                className={mode === tab.key ? "btn-main small" : "btn-ghost small"}
                key={tab.key}
                onClick={() => setMode(tab.key)}
                type="button"
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        <div className="resource-grid">
          {items.length ? (
            items.map((article) => (
              <button
                className="resource-card"
                key={article.article_id}
                onClick={() => setSelectedArticle(article)}
                type="button"
              >
                <div className="resource-card-top">
                  <span className="status-pill status-open">
                    {article.category || "Article"}
                  </span>
                  <span className="muted">{article.author_name || "Doctor"}</span>
                </div>
                <h3>{article.title}</h3>
                <p>{getExcerpt(article.body)}</p>
                <div className="resource-meta">
                  <span><Heart size={15} /> {article.likes_count || 0}</span>
                  <span><MessageCircle size={15} /> {article.comments_count || 0}</span>
                </div>
              </button>
            ))
          ) : (
            <div className="empty-panel">No articles found in this section.</div>
          )}
        </div>
      </section>

      {composerOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setComposerOpen(false);
        }}>
          <div className="modal-card modal-narrow" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <h3>Add Blog</h3>
                <p className="muted">Submitted blogs go to admin approval.</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setComposerOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form className="form-grid" onSubmit={createArticle}>
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Title"
                required
              />
              <input
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category: event.target.value }))
                }
                placeholder="Category"
              />
              <textarea
                rows="9"
                value={form.body}
                onChange={(event) =>
                  setForm((current) => ({ ...current, body: event.target.value }))
                }
                placeholder="Write your article..."
                required
              />
              <div className="modal-actions">
                <button className="btn-ghost" type="button" onClick={() => setComposerOpen(false)}>
                  Cancel
                </button>
                <button className="btn-main" type="submit">
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedArticle && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedArticle(null);
        }}>
          <div className="modal-card" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <p className="eyebrow">{selectedArticle.category || "Article"}</p>
                <h3>{selectedArticle.title}</h3>
                <p className="muted">By {selectedArticle.author_name || "Doctor"}</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setSelectedArticle(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p className="article-body">{selectedArticle.body}</p>

              <div className="inline-actions wrap">
                <button
                  className="btn-ghost small"
                  disabled={likedArticles.has(selectedArticle.article_id) || liking[selectedArticle.article_id]}
                  onClick={() => likeArticle(selectedArticle.article_id)}
                  type="button"
                >
                  <Heart size={16} />
                  {likedArticles.has(selectedArticle.article_id) ? "Liked" : "Like"}
                </button>
                <button
                  className="btn-ghost small"
                  onClick={() => bookmarkArticle(selectedArticle.article_id)}
                  type="button"
                >
                  <Bookmark size={16} />
                  Bookmark
                </button>
              </div>

              <div className="comment-panel">
                <h4>Comments ({selectedArticle.comments_count || 0})</h4>
                <div className="comment-list">
                  {Array.isArray(selectedArticle.comments) && selectedArticle.comments.length ? (
                    selectedArticle.comments.map((comment) => (
                      <div className="comment-card" key={comment.comment_id}>
                        <div>
                          <strong>{comment.commenter_name || "Reader"}</strong>
                          <span className="muted">
                            {comment.created_at
                              ? new Date(comment.created_at).toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                        <p>{comment.body}</p>
                      </div>
                    ))
                  ) : (
                    <p className="muted">No comments yet.</p>
                  )}
                </div>
                <div className="comment-composer">
                  <input
                    value={commentText[selectedArticle.article_id] || ""}
                    onChange={(event) =>
                      setCommentText((current) => ({
                        ...current,
                        [selectedArticle.article_id]: event.target.value,
                      }))
                    }
                    placeholder="Write a comment..."
                  />
                  <button
                    className="btn-main small"
                    onClick={() => commentArticle(selectedArticle.article_id)}
                    type="button"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialBlogs;
