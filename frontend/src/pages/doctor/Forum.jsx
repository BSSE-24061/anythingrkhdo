import { useEffect, useState } from "react";

import { forumApi } from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";

const Forum = () => {
  const user = getStoredUser();
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [form, setForm] = useState({ category: "", title: "", body: "" });
  const [replyBody, setReplyBody] = useState("");
  const [reportBody, setReportBody] = useState("");
  const [userLikedPosts, setUserLikedPosts] = useState(new Set());
  const [liking, setLiking] = useState({});
  const [postLikeCounts, setPostLikeCounts] = useState({});

  const loadPosts = async () => {
    try {
      const response = await forumApi.feed();
      setPosts(response.data || []);
      
      // Initialize like counts
      const counts = {};
      (response.data || []).forEach(post => {
        counts[post.post_id] = post.likes_count || 0;
      });
      setPostLikeCounts(counts);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const openPost = async (postId) => {
    try {
      const response = await forumApi.getPost(postId);
      setSelectedPost(response.data.post);
      setReplies(response.data.replies || []);
    } catch (error) {
      console.error(error);
    }
  };

  const createPost = async (event) => {
    event.preventDefault();
    try {
      await forumApi.createPost({ ...form, user_id: user.id });
      setForm({ category: "", title: "", body: "" });
      loadPosts();
    } catch (error) {
      console.error(error);
    }
  };

  const addReply = async () => {
    if (!selectedPost || !replyBody) return;
    try {
      await forumApi.reply({ post_id: selectedPost.post_id, user_id: user.id, body: replyBody });
      setReplyBody("");
      openPost(selectedPost.post_id);
    } catch (error) {
      console.error(error);
    }
  };

  const reportPost = async () => {
    if (!selectedPost || !reportBody) return;
    try {
      await forumApi.report({ post_id: selectedPost.post_id, user_id: user.id, reason: "other", description: reportBody });
      setReportBody("");
    } catch (error) {
      console.error(error);
    }
  };

  const likePost = (postId) => {
    // Prevent double-like
    if (userLikedPosts.has(postId) || liking[postId]) {
      return;
    }

    setLiking((prev) => ({ ...prev, [postId]: true }));
    
    // Add to liked posts
    setUserLikedPosts((prev) => new Set(prev).add(postId));
    
    // Increment like count
    setPostLikeCounts((prev) => ({
      ...prev,
      [postId]: (prev[postId] || 0) + 1,
    }));
    
    // Simulate API delay
    setTimeout(() => {
      setLiking((prev) => ({ ...prev, [postId]: false }));
    }, 300);
  };

  return (
    <>
      <section className="page-heading">
        <div>
          <h1>Forum</h1>
          <p className="muted">Post, discuss, like locally, reply, and report items for moderation.</p>
        </div>
      </section>

      <section className="grid-layout two-col">
        <div className="card">
          <div className="section-heading"><h3>Create Post</h3></div>
          <form className="form-grid" onSubmit={createPost}>
            <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Category" />
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Title" required />
            <textarea rows="8" value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} placeholder="What do you want to discuss?" required />
            <button type="submit" className="btn-main">Publish Post</button>
          </form>

          <div className="section-heading" style={{ marginTop: 20 }}><h3>Forum Feed</h3></div>
          <div className="list-stack">
            {posts.length ? posts.map((post) => (
              <div className="list-item" key={post.post_id}>
                <strong>{post.title}</strong>
                <span>{post.author_name || post.user_id}</span>
                <p>{post.body}</p>
                <div className="inline-actions wrap">
                  <button className="btn-soft small" onClick={() => openPost(post.post_id)}>Open</button>
                  <button 
                    className="btn-soft small" 
                    onClick={() => likePost(post.post_id)}
                    disabled={userLikedPosts.has(post.post_id) || liking[post.post_id]}
                    style={{ 
                      opacity: (userLikedPosts.has(post.post_id) || liking[post.post_id]) ? 0.6 : 1,
                      cursor: (userLikedPosts.has(post.post_id) || liking[post.post_id]) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {liking[post.post_id] ? "Liking..." : (userLikedPosts.has(post.post_id) ? "✓ Liked" : "Like")} ({postLikeCounts[post.post_id] || 0})
                  </button>
                </div>
              </div>
            )) : <p className="muted">No forum posts yet.</p>}
          </div>
        </div>

        <div className="card">
          <div className="section-heading"><h3>Selected Post</h3></div>
          {selectedPost ? (
            <>
              <div className="list-item">
                <strong>{selectedPost.title}</strong>
                <p>{selectedPost.body}</p>
              </div>

              <div style={{ marginTop: 20 }}>
                <div className="section-heading"><h3>Replies</h3></div>
                <div className="list-stack">
                  {replies.length ? replies.map((reply) => (
                    <div className="list-item" key={reply.reply_id}>
                      <strong>{reply.replier_name}</strong>
                      <p>{reply.body}</p>
                    </div>
                  )) : <p className="muted">No replies yet.</p>}
                </div>
              </div>

              <div className="section-heading" style={{ marginTop: 20 }}><h3>Reply</h3></div>
              <textarea rows="4" value={replyBody} onChange={(event) => setReplyBody(event.target.value)} placeholder="Write a reply" />
              <button className="btn-main" style={{ marginTop: 10 }} onClick={addReply}>Send Reply</button>

              <div className="section-heading" style={{ marginTop: 20 }}><h3>Report</h3></div>
              <textarea rows="4" value={reportBody} onChange={(event) => setReportBody(event.target.value)} placeholder="Report details" />
              <button className="btn-soft" style={{ marginTop: 10 }} onClick={reportPost}>Report Post</button>
            </>
          ) : (
            <p className="muted">Open a post to reply or report it.</p>
          )}
        </div>
      </section>
    </>
  );
};

export default Forum;