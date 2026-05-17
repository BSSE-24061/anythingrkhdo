import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { forumApi, getErrorMessage } from "../utils/apiHelper";
import { getStoredUser } from "../utils/session";

const REPORT_REASONS = ["spam", "abuse", "misinformation", "other"];

const Forum = () => {
  const user = useMemo(() => getStoredUser(), []);
  const [searchParams, setSearchParams] = useSearchParams();
  const postIdFromUrl = searchParams.get("post");

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [newPost, setNewPost] = useState({ title: "", body: "", category: "" });
  const [thread, setThread] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [reportDraft, setReportDraft] = useState({
    postId: null,
    reason: "spam",
    description: "",
  });

  const loadFeed = async () => {
    const response = await forumApi.feed();
    setPosts(Array.isArray(response.data) ? response.data : []);
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      setError("");
      try {
        await loadFeed();
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load forum posts"));
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const hydrateThread = useCallback(
    async (postId) => {
      if (!postId) {
        setThread(null);
        return;
      }

      try {
        setError("");
        const detail = await forumApi.getPost(postId);
        const payload = detail.data || {};
        setThread({
          post: payload.post,
          replies: payload.replies || [],
        });
      } catch {
        setError("Unable to open that thread anymore.");
        setSearchParams({});
      }
    },
    [setSearchParams],
  );

  useEffect(() => {
    if (postIdFromUrl) {
      void hydrateThread(postIdFromUrl);
    } else {
      setThread(null);
    }
  }, [hydrateThread, postIdFromUrl]);

  const openPost = (postId) => {
    setSearchParams({ post: postId });
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    setNotice("");
    setError("");
    try {
      const response = await forumApi.createPost({
        user_id: user.id,
        ...newPost,
      });

      await loadFeed();

      const created = response.data?.post;
      if (created?.post_id) {
        openPost(created.post_id);
      }

      setNewPost({ title: "", body: "", category: "" });
      setNotice("Post published!");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to publish post."));
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    const targetId = thread?.post?.post_id;
    if (!targetId || !replyDraft.trim()) return;

    // Optimistic UI: show reply immediately, then sync with server
    const trimmed = replyDraft.trim();
    const tempId = `temp-${Date.now()}`;
    const optimisticReply = {
      reply_id: tempId,
      post_id: targetId,
      replier_name: user?.name || "You",
      body: trimmed,
      created_at: new Date().toISOString(),
    };

    // Add optimistic reply to thread immediately
    setThread((prev) => ({
      ...prev,
      replies: [...(prev?.replies || []), optimisticReply],
    }));
    setReplyDraft("");
    setNotice("Reply posted.");

    try {
      setError("");
      await forumApi.reply({
        post_id: targetId,
        user_id: user.id,
        body: trimmed,
      });

      // Refresh authoritative thread data (replace optimistic reply)
      await hydrateThread(targetId);
    } catch (err) {
      setError(getErrorMessage(err, "Reply failed."));
      // Revert optimistic change by reloading thread from server
      await hydrateThread(targetId);
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!reportDraft.postId) return;

    try {
      await forumApi.report({
        post_id: reportDraft.postId,
        reported_by: user.id,
        reason: reportDraft.reason,
        description: reportDraft.description || null,
      });
      setReportDraft({
        postId: null,
        reason: "spam",
        description: "",
      });
      setNotice("Thanks — moderators received your report.");
    } catch {
      setError("Unable to submit report.");
    }
  };

  const closeThreadView = () => {
    setSearchParams({});
    setThread(null);
  };

  const handlePostField = (event) =>
    setNewPost((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));

  if (loading) {
    return (
      <div className="content-page">
        <p className="muted">Loading community desk...</p>
      </div>
    );
  }

  return (
    <div className="content-page">
      <section className="panel">
        <p className="eyebrow">Community</p>
        <h2>Forum</h2>
        <p className="muted">
          Discuss lived experiences respectfully — flag anything off-guidelines via{" "}
          <strong style={{ fontWeight: 800 }}>Report</strong>.
        </p>

        {error && <p className="error-text">{error}</p>}
        {notice && <p className="alert alert-success">{notice}</p>}

        {!thread && (
          <form onSubmit={handleSubmitPost} className="form-grid" style={{ marginTop: 12 }}>
            <label>
              Title
              <input type="text" name="title" value={newPost.title} onChange={handlePostField} required />
            </label>

            <label>
              Category
              <input
                type="text"
                name="category"
                value={newPost.category}
                onChange={handlePostField}
                placeholder="e.g. Chronic care"
              />
            </label>

            <label className="full-span">
              Message
              <textarea name="body" rows={6} value={newPost.body} onChange={handlePostField} required />
            </label>

            <button type="submit" className="btn-main small">
              Publish post
            </button>
          </form>
        )}

        {!thread &&
          posts.map((post) => (
            <div key={post.post_id} className="list-item" style={{ marginTop: 14 }}>
              <div className="section-heading" style={{ marginBottom: 0 }}>
                <h4 style={{ margin: 0 }}>{post.title}</h4>
              </div>
              <p>{post.body?.slice(0, 320)}{post.body?.length > 320 ? "..." : ""}</p>
              <p className="muted">
                {post.user_name} · {post.category || "general"} · {new Date(post.created_at).toLocaleDateString()}
              </p>

              <div className="inline-actions wrap">
                <button type="button" className="btn-main small" onClick={() => openPost(post.post_id)}>
                  Open thread · {post.views_count || 0} views
                </button>

                <button
                  type="button"
                  className="btn-ghost small"
                  onClick={() =>
                    setReportDraft({
                      postId: post.post_id,
                      reason: "spam",
                      description: "",
                    })
                  }
                >
                  Report
                </button>
              </div>
            </div>
          ))}
      </section>

      {thread?.post && (
        <section className="panel">
          <button type="button" className="btn-ghost small" onClick={closeThreadView}>
            ← Back to feed
          </button>

          <div style={{ marginTop: 14 }}>
            <h3>{thread.post.title}</h3>
            <p className="muted">
              {(thread.post.user_name || "Member") +
                ` · ${new Date(thread.post.created_at).toLocaleString()}`}
            </p>
            <div className="list-item" style={{ marginTop: 12 }}>
              <p>{thread.post.body}</p>
            </div>

            <div className="inline-actions wrap">
              <button
                type="button"
                className="btn-ghost small"
                onClick={() =>
                  setReportDraft({
                    postId: thread.post.post_id,
                    reason: "spam",
                    description: "",
                  })
                }
              >
                Report post
              </button>
            </div>

            <div className="forum-reply-stack">
              {(thread.replies || []).length === 0 && (
                <p className="muted">No replies yet — start the dialogue.</p>
              )}

              {(thread.replies || []).map((reply) => (
                <article key={reply.reply_id} className="nested-panel">
                  <strong>{reply.replier_name || "Participant"}</strong>
                  <p>{reply.body}</p>
                  <span className="muted">{new Date(reply.created_at).toLocaleString()}</span>
                </article>
              ))}
            </div>

            <form className="message-composer" onSubmit={handleReply}>
              <label>
                Reply as {user?.name?.split?.(" ")?.[0] || "you"}
                <textarea
                  rows={4}
                  value={replyDraft}
                  placeholder="Respond with empathy and clarity."
                  onChange={(event) => setReplyDraft(event.target.value)}
                  required
                />
              </label>
              <button type="submit" className="btn-main small">
                Post reply
              </button>
            </form>
          </div>
        </section>
      )}

      {reportDraft.postId && (
        <section className="panel">
          <h3>Report content</h3>
          <p className="muted">Trusted moderators review every submission privately.</p>
          <form className="form-grid" onSubmit={submitReport}>
            <label>
              Reason
              <select
                value={reportDraft.reason}
                onChange={(event) =>
                  setReportDraft((prev) => ({ ...prev, reason: event.target.value }))
                }
              >
                {REPORT_REASONS.map((reasonOption) => (
                  <option key={reasonOption} value={reasonOption}>
                    {reasonOption.replace(/^\w/, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Context (optional)
              <textarea
                rows={3}
                value={reportDraft.description}
                onChange={(event) =>
                  setReportDraft((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </label>

            <div className="inline-actions">
              <button type="submit" className="btn-main small">
                Submit report
              </button>

              <button
                type="button"
                className="btn-ghost small"
                onClick={() =>
                  setReportDraft({
                    postId: null,
                    reason: "spam",
                    description: "",
                  })
                }
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
};

export default Forum;
