const db = require("../config/db");
let isInitialized = false;
const initForumTables = async () => {
  if (isInitialized) return;
  try {
    await db.query(`ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;`).catch(() => {});
    await db.query(`
      CREATE TABLE IF NOT EXISTS forum_post_likes (
        like_id SERIAL PRIMARY KEY,
        post_id UUID NOT NULL REFERENCES forum_posts(post_id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (post_id, user_id)
      );
    `).catch(() => db.query(`
      CREATE TABLE IF NOT EXISTS forum_post_likes (
        like_id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES forum_posts(post_id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (post_id, user_id)
      );
    `));
    isInitialized = true;
  } catch (err) {
    console.error("Auto-migration failed:", err.message);
  }
};

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

<<<<<<< HEAD
const getForumPosts = async (userId = null) => {
  await initForumTables();
  const query = `
        SELECT fp.*, u.full_name AS author_name, u.role AS author_role,
               COALESCE(like_counts.likes_count, 0) AS likes_count,
               EXISTS(
                 SELECT 1 FROM forum_post_likes fl
                 WHERE fl.post_id = fp.post_id
                   AND fl.user_id = $1
               ) AS user_has_liked
        FROM forum_posts fp
        JOIN users u ON fp.user_id = u.user_id
        LEFT JOIN (
          SELECT post_id, COUNT(*) AS likes_count
          FROM forum_post_likes
          GROUP BY post_id
        ) AS like_counts ON like_counts.post_id = fp.post_id
        WHERE fp.status = 'active'
        ORDER BY fp.created_at DESC;
    `;
  const result = await db.query(query, [userId]);
  return result.rows;
};

const getForumPostById = async (postId) => {
<<<<<<< HEAD
  await initForumTables();
=======
>>>>>>> parent of 42a0ed9 (push)
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

<<<<<<< HEAD
const checkUserLikedPost = async (postId, userId) => {
  await initForumTables();
  const query = `
    SELECT COUNT(*) AS like_count
    FROM forum_post_likes
    WHERE post_id = $1 AND user_id = $2;
  `;
  const result = await db.query(query, [postId, userId]);
  return result.rows[0].like_count > 0;
};

const likePost = async (postId, userId) => {
  const alreadyLiked = await checkUserLikedPost(postId, userId);
  if (alreadyLiked) {
    const error = new Error("User has already liked this post");
    error.code = "23505";
    throw error;
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const query = `
          INSERT INTO forum_post_likes (post_id, user_id)
          VALUES ($1, $2)
          RETURNING *;
      `;
    const result = await client.query(query, [postId, userId]);
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const incrementViewCount = async (postId) => {
  const query = `UPDATE forum_posts SET views_count = COALESCE(views_count, 0) + 1 WHERE post_id = $1;`;
=======
const incrementViewCount = async (postId) => {
  const query = `UPDATE forum_posts SET views_count = views_count + 1 WHERE post_id = $1;`;
>>>>>>> parent of 42a0ed9 (push)
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
<<<<<<< HEAD
  likePost,
=======
>>>>>>> parent of 42a0ed9 (push)
  incrementViewCount,
  reportPost,
  getReportedPosts,
  updateForumPostStatus,
};
