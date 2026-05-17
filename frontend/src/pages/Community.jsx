import { useCallback, useEffect, useMemo, useState } from "react";
import { blogApi, forumApi } from "../utils/apiHelper";
import { getStoredUser } from "../utils/session";

const Community = () => {
  const user = useMemo(() => getStoredUser(), []);
  const [forumPosts, setForumPosts] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [pendingBlogs, setPendingBlogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [postDraft, setPostDraft] = useState({ title: "", body: "" });

  const loadData = useCallback(async () => {
    try {
      setError("");
      const [forumRes, blogRes] = await Promise.all([
        forumApi.feed(),
        blogApi.feed(),
      ]);
      setForumPosts(forumRes.data);
      setBlogs(blogRes.data);

      if (user?.role === "admin") {
        const [pendingRes, reportsRes] = await Promise.all([
          blogApi.pending(),
          forumApi.reports(),
        ]);
        setPendingBlogs(pendingRes.data);
        setReports(reportsRes.data);
      }
    } catch {
      setError("Unable to load community feed.");
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    const handle = window.requestAnimationFrame(() => {
      void loadData();
    });
    return () => window.cancelAnimationFrame(handle);
  }, [loadData]);

  const createPost = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    const postTitle = postDraft.title;
    const postBody = postDraft.body;

    try {
      // Optimistic update
      const optimisticPost = {
        post_id: `temp-${Date.now()}`,
        title: postTitle,
        body: postBody,
        author_name: user?.full_name || "You",
        author_role: user?.role || "user",
        created_at: new Date().toISOString(),
      };
      setForumPosts((prev) => [optimisticPost, ...prev]);
      setPostDraft({ title: "", body: "" });
      setNotice("Post published!");

      // API call in background
      await forumApi.createPost({
        user_id: user.id,
        title: postTitle,
        body: postBody,
      });

      // Refresh data
      await loadData();
    } catch (err) {
      setError("Could not publish post.");
      // Revert optimistic update on error
      await loadData();
    }
  };

  const moderateBlog = async (articleId, status) => {
    try {
      await blogApi.updateStatus(articleId, status);
      loadData();
    } catch {
      setError("Could not update article status.");
    }
  };

  const moderateForum = async (postId, status) => {
    try {
      await forumApi.updatePostStatus(postId, status);
      loadData();
    } catch {
      setError("Could not update forum post status.");
    }
  };

  return (
    <div className="content-page">
      <section className="panel">
        <h2>Community</h2>
        <p className="muted">Forum discussions and medical blog updates.</p>
        {error && <p className="error-text">{error}</p>}

        <form onSubmit={createPost} className="form-grid compact">
          <input
            type="text"
            placeholder="Post title"
            value={postDraft.title}
            onChange={(e) =>
              setPostDraft((prev) => ({ ...prev, title: e.target.value }))
            }
            required
          />
          <textarea
            placeholder="Share your thoughts"
            value={postDraft.body}
            onChange={(e) =>
              setPostDraft((prev) => ({ ...prev, body: e.target.value }))
            }
            rows={4}
            required
          />
          <button type="submit" className="btn-main small">
            Create Post
          </button>
        </form>
      </section>

      <section className="panel">
        <h3>Forum Feed</h3>
        <div className="list-stack">
          {forumPosts.length === 0 && (
            <p className="muted">No forum posts yet.</p>
          )}
          {forumPosts.map((post) => (
            <article key={post.post_id} className="list-item block">
              <strong>{post.title}</strong>
              <p>{post.body}</p>
              <small className="muted">
                By {post.author_name} ({post.author_role})
              </small>
              {user?.role === "admin" && (
                <div className="inline-actions">
                  <button
                    type="button"
                    className="btn-ghost small"
                    onClick={() => moderateForum(post.post_id, "active")}
                  >
                    Show
                  </button>
                  <button
                    type="button"
                    className="btn-ghost small"
                    onClick={() => moderateForum(post.post_id, "hidden")}
                  >
                    Hide
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Blog Feed</h3>
        <div className="list-stack">
          {blogs.length === 0 && (
            <p className="muted">No active blog articles.</p>
          )}
          {blogs.map((article) => (
            <article key={article.article_id} className="list-item block">
              <strong>{article.title}</strong>
              <p>{article.body?.slice(0, 220)}...</p>
              <small className="muted">
                Category: {article.category || "General"}
              </small>
            </article>
          ))}
        </div>
      </section>

      {user?.role === "admin" && (
        <section className="panel">
          <h3>Moderation Queue</h3>

          <h4>Pending Blog Articles</h4>
          <div className="list-stack">
            {pendingBlogs.length === 0 && (
              <p className="muted">No pending blog articles.</p>
            )}
            {pendingBlogs.map((item) => (
              <article key={item.article_id} className="list-item block">
                <strong>{item.title}</strong>
                <small className="muted">By {item.author_name}</small>
                <div className="inline-actions">
                  <button
                    type="button"
                    className="btn-main small"
                    onClick={() => moderateBlog(item.article_id, "active")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn-ghost small"
                    onClick={() => moderateBlog(item.article_id, "hidden")}
                  >
                    Keep Hidden
                  </button>
                  <button
                    type="button"
                    className="btn-ghost small"
                    onClick={() => moderateBlog(item.article_id, "deleted")}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>

          <h4>Reported Forum Posts</h4>
          <div className="list-stack">
            {reports.length === 0 && <p className="muted">No reports.</p>}
            {reports.map((report) => (
              <article key={report.report_id} className="list-item block">
                <strong>{report.title}</strong>
                <small className="muted">Reason: {report.reason}</small>
                <p>
                  {report.description || "No additional description provided."}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Community;
