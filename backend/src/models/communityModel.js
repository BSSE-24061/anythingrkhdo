const db = require("../config/db");

const createForumPost = async (postData) => {
  const { user_id, category, title, body } = postData;

  const query = `
        INSERT INTO forum_posts (user_id, category, title, body)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;

  const result = await db.query(query, [user_id, category, title, body]);
  return result.rows[0];
};

const getForumPosts = async () => {
  const query = `
        SELECT fp.*, u.full_name AS author_name, u.role AS author_role
        FROM forum_posts fp
        JOIN users u ON fp.user_id = u.user_id
        WHERE fp.status = 'active'
        ORDER BY fp.created_at DESC;
    `;
  const result = await db.query(query);
  return result.rows;
};

const getForumPostById = async (postId) => {
  const query = `
        SELECT fp.*, u.full_name AS author_name, u.role AS author_role
        FROM forum_posts fp
        JOIN users u ON fp.user_id = u.user_id
        WHERE fp.post_id = $1;
    `;
  const result = await db.query(query, [postId]);
  return result.rows[0];
};

const addReply = async (replyData) => {
  const { post_id, user_id, body } = replyData;

  const query = `
        INSERT INTO forum_replies (post_id, user_id, body)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;

  const result = await db.query(query, [post_id, user_id, body]);
  return result.rows[0];
};

const getPostReplies = async (postId) => {
  const query = `
        SELECT fr.*, u.full_name AS replier_name, u.role AS replier_role
        FROM forum_replies fr
        JOIN users u ON fr.user_id = u.user_id
        WHERE fr.post_id = $1 AND fr.status = 'active'
        ORDER BY fr.created_at ASC;
    `;
  const result = await db.query(query, [postId]);
  return result.rows;
};

const incrementViewCount = async (postId) => {
  const query = `UPDATE forum_posts SET views_count = views_count + 1 WHERE post_id = $1;`;
  await db.query(query, [postId]);
};

const reportPost = async (postId, reportedBy, reason, description) => {
  const query = `
        INSERT INTO forum_reports (post_id, reported_by, reason, description)
        VALUES ($1, $2, $3::report_reason, $4)
        RETURNING *;
    `;
  const result = await db.query(query, [
    postId,
    reportedBy,
    reason,
    description || null,
  ]);
  return result.rows[0];
};

const getReportedPosts = async () => {
  const query = `
        SELECT fr.*, fp.title, fp.body, fp.status AS post_status, u.full_name AS reporter_name
        FROM forum_reports fr
        JOIN forum_posts fp ON fr.post_id = fp.post_id
        LEFT JOIN users u ON fr.reported_by = u.user_id
        ORDER BY fr.created_at DESC;
    `;
  const result = await db.query(query);
  return result.rows;
};

const updateForumPostStatus = async (postId, status) => {
  const query = `
        UPDATE forum_posts
        SET status = $1::forum_status,
            updated_at = NOW()
        WHERE post_id = $2
        RETURNING *;
    `;
  const result = await db.query(query, [status, postId]);
  return result.rows[0];
};

module.exports = {
  createForumPost,
  getForumPosts,
  getForumPostById,
  addReply,
  getPostReplies,
  incrementViewCount,
  reportPost,
  getReportedPosts,
  updateForumPostStatus,
};
