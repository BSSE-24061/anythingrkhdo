import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { blogApi, getErrorMessage } from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";

const BlogArticle = () => {
  const { articleId } = useParams();
  const user = useMemo(() => getStoredUser(), []);
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentBody, setCommentBody] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [userLiked, setUserLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  const loadArticle = useCallback(async () => {
    if (!articleId) return;

    const detail = await blogApi.getArticle(articleId, user?.id);
    const payload = detail.data || {};
    setArticle(payload.article);
    setComments(Array.isArray(payload.comments) ? payload.comments : []);
    setUserLiked(payload.article?.user_has_liked || false);
  }, [articleId, user?.id]);

  useEffect(() => {
    const init = async () => {
      setError("");
      try {
        await loadArticle();
      } catch (err) {
        setError(getErrorMessage(err, "Unable to load this article."));
        setArticle(null);
      }
    };
    void init();
  }, [loadArticle]);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentBody.trim()) return;

    const commentText = commentBody.trim();
    
    try {
      setError("");
      
      // Optimistic update - add comment immediately to UI
      const optimisticComment = {
        comment_id: `temp-${Date.now()}`,
        body: commentText,
        commenter_name: user?.full_name || "You",
        created_at: new Date().toISOString(),
      };
      setComments((prev) => [...prev, optimisticComment]);
      setCommentBody("");
      setNotice("Comment added.");
      
      // API call in background
      await blogApi.comment({
        article_id: articleId,
        user_id: user.id,
        body: commentText,
      });
      
      // Refresh to get the actual comment from server
      await loadArticle();
    } catch (err) {
      setError("Comment could not be published.");
      // Revert optimistic update on error
      await loadArticle();
    }
  };

  const handleLike = async () => {
    if (userLiked || liking) {
      if (userLiked) {
        setNotice("You have already liked this article.");
      }
      return;
    }

    setLiking(true);

    try {
      await blogApi.like({ article_id: articleId, user_id: user.id });
      setUserLiked(true);
      setNotice("Thanks for appreciating this story.");
      setArticle((prev) => ({
        ...prev,
        likes_count: (prev?.likes_count || 0) + 1,
      }));
    } catch (err) {
      const message = getErrorMessage(err);
      if (message.toLowerCase().includes("already")) {
        setUserLiked(true);
        setNotice("You already liked this article.");
      } else {
        setError(message);
      }
    } finally {
      setLiking(false);
    }
  };

  const handleBookmark = async () => {
    if (bookmarked || bookmarking) return;

    setBookmarking(true);

    try {
      setError("");
      await blogApi.bookmark({ article_id: articleId, user_id: user.id });
      setBookmarked(true);
      setNotice("Article bookmarked.");
    } catch (err) {
      const message = getErrorMessage(err, "Could not bookmark article.");
      if (message.toLowerCase().includes("already")) {
        setBookmarked(true);
        setNotice("This article is already in your bookmarks.");
      } else {
        setError(message);
      }
    } finally {
      setBookmarking(false);
    }
  };

  if (error && !article) {
    return (
      <div className="content-page">
        <section className="panel">
          <p className="error-text">{error}</p>
          <Link to="/blogs" className="btn-ghost small">
            Back to blogs
          </Link>
        </section>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="content-page">
        <p className="muted">Loading article...</p>
      </div>
    );
  }

  return (
    <div className="content-page">
      <section className="panel">
        <Link to="/blogs" className="btn-ghost small">
          All articles
        </Link>

        <div style={{ marginTop: 14 }}>
          <p className="eyebrow">{article.category || "Wellness"}</p>
          <h2>{article.title}</h2>

          <div className="inline-actions wrap" style={{ marginTop: 8 }}>
            <span className="muted">
              {(article.author_name || "Care team") +
                " - " +
                new Date(article.published_at || article.created_at).toLocaleString()}
            </span>
            <button
              type="button"
              className="btn-main small"
              onClick={handleLike}
              disabled={userLiked || liking}
              style={{
                opacity: (userLiked || liking) ? 0.6 : 1,
                cursor: (userLiked || liking) ? "not-allowed" : "pointer",
              }}
            >
              {liking ? "Liking..." : (userLiked ? "Liked" : "Like")} - {article.likes_count || 0}
            </button>
            <button
              type="button"
              className="btn-soft small"
              onClick={handleBookmark}
              disabled={bookmarked || bookmarking}
            >
              {bookmarking ? "Bookmarking..." : (bookmarked ? "Bookmarked" : "Bookmark")}
            </button>
          </div>

          {error && <p className="error-text">{error}</p>}
          {notice && <p className="alert alert-success">{notice}</p>}

          <div className="list-item" style={{ marginTop: 16 }}>
            <p style={{ whiteSpace: "pre-wrap" }}>{article.body}</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <h3>Discussion</h3>
        <div className="forum-reply-stack">
          {comments.map((commentEntry) => (
            <article key={commentEntry.comment_id} className="nested-panel">
              <strong>{commentEntry.commenter_name || "Reader"}</strong>
              <p>{commentEntry.body}</p>
              <span className="muted">
                {new Date(commentEntry.created_at).toLocaleString()}
              </span>
            </article>
          ))}
        </div>

        <form className="message-composer" style={{ marginTop: 16 }} onSubmit={handleComment}>
          <label>
            Leave a supportive note
            <textarea
              rows={4}
              required
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
            />
          </label>

          <button type="submit" className="btn-main small">
            Post comment
          </button>
        </form>
      </section>
    </div>
  );
};

export default BlogArticle;
