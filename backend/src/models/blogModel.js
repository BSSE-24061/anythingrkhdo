const db = require("../config/db");

const createArticle = async (articleData) => {
  const { author_user_id, title, body, cover_image, category, status } =
    articleData;
  const articleStatus = status || "hidden";
  const publishedAt = articleStatus === "active" ? new Date() : null;

  const query = `
        INSERT INTO blog_articles (author_user_id, title, body, cover_image, category, status, published_at)
        VALUES ($1, $2, $3, $4, $5, $6::forum_status, $7)
        RETURNING *;
    `;

  const result = await db.query(query, [
    author_user_id,
    title,
    body,
    cover_image,
    category,
    articleStatus,
    publishedAt,
  ]);
  return result.rows[0];
};

const getArticles = async (userId = null) => {
  const query = `
        SELECT ba.*, u.full_name AS author_name, u.specialization,
               COALESCE(like_counts.likes_count, 0) AS likes_count,
               COALESCE(comment_counts.comments_count, 0) AS comments_count,
               COALESCE(comment_preview.comments, '[]'::json) AS comments,
               EXISTS(
                 SELECT 1 FROM article_likes al
                 WHERE al.article_id = ba.article_id
                   AND al.user_id = $1
               ) AS user_has_liked
        FROM blog_articles ba
        JOIN users u ON ba.author_user_id = u.user_id
        LEFT JOIN (
          SELECT article_id, COUNT(*) AS likes_count
          FROM article_likes
          GROUP BY article_id
        ) AS like_counts ON like_counts.article_id = ba.article_id
        LEFT JOIN (
          SELECT article_id, COUNT(*) AS comments_count
          FROM article_comments
          GROUP BY article_id
        ) AS comment_counts ON comment_counts.article_id = ba.article_id
        LEFT JOIN LATERAL (
          SELECT json_agg(row_to_json(comment_row) ORDER BY comment_row.created_at ASC) AS comments
          FROM (
            SELECT ac.comment_id, ac.article_id, ac.user_id, ac.body, ac.created_at,
                   cu.full_name AS commenter_name, cu.role AS commenter_role
            FROM article_comments ac
            JOIN users cu ON ac.user_id = cu.user_id
            WHERE ac.article_id = ba.article_id
            ORDER BY ac.created_at ASC
          ) AS comment_row
        ) AS comment_preview ON true
        WHERE ba.status = 'active'
        ORDER BY ba.published_at DESC;
    `;
  const result = await db.query(query, [userId]);
  return result.rows;
};

const getPendingArticles = async (userId = null) => {
  const query = `
        SELECT ba.*, u.full_name AS author_name, u.specialization,
               COALESCE(like_counts.likes_count, 0) AS likes_count,
               COALESCE(comment_counts.comments_count, 0) AS comments_count,
               COALESCE(comment_preview.comments, '[]'::json) AS comments,
               EXISTS(
                 SELECT 1 FROM article_likes al
                 WHERE al.article_id = ba.article_id
                   AND al.user_id = $1
               ) AS user_has_liked
        FROM blog_articles ba
        JOIN users u ON ba.author_user_id = u.user_id
        LEFT JOIN (
          SELECT article_id, COUNT(*) AS likes_count
          FROM article_likes
          GROUP BY article_id
        ) AS like_counts ON like_counts.article_id = ba.article_id
        LEFT JOIN (
          SELECT article_id, COUNT(*) AS comments_count
          FROM article_comments
          GROUP BY article_id
        ) AS comment_counts ON comment_counts.article_id = ba.article_id
        LEFT JOIN LATERAL (
          SELECT json_agg(row_to_json(comment_row) ORDER BY comment_row.created_at ASC) AS comments
          FROM (
            SELECT ac.comment_id, ac.article_id, ac.user_id, ac.body, ac.created_at,
                   cu.full_name AS commenter_name, cu.role AS commenter_role
            FROM article_comments ac
            JOIN users cu ON ac.user_id = cu.user_id
            WHERE ac.article_id = ba.article_id
            ORDER BY ac.created_at ASC
          ) AS comment_row
        ) AS comment_preview ON true
        WHERE ba.status = 'hidden' AND ($1::uuid IS NULL OR ba.author_user_id = $1)
        ORDER BY ba.created_at DESC;
    `;
  const result = await db.query(query, [userId || null]);
  return result.rows;
};

const addComment = async (commentData) => {
  const { article_id, user_id, body } = commentData;

  const query = `
        WITH inserted_comment AS (
          INSERT INTO article_comments (article_id, user_id, body)
          VALUES ($1, $2, $3)
          RETURNING *
        )
        SELECT ic.*, u.full_name AS commenter_name, u.role AS commenter_role
        FROM inserted_comment ic
        JOIN users u ON ic.user_id = u.user_id;
    `;

  const result = await db.query(query, [article_id, user_id, body]);
  return result.rows[0];
};

const checkUserBookmarked = async (articleId, userId) => {
  const query = `
    SELECT COUNT(*) as bookmark_count
    FROM article_bookmarks
    WHERE article_id = $1 AND user_id = $2;
  `;
  const result = await db.query(query, [articleId, userId]);
  return result.rows[0].bookmark_count > 0;
};

const bookmarkArticle = async (bookmarkData) => {
  const { article_id, user_id } = bookmarkData;

  // Check if user has already bookmarked this article
  const alreadyBookmarked = await checkUserBookmarked(article_id, user_id);
  if (alreadyBookmarked) {
    const error = new Error("User has already bookmarked this article");
    error.code = "23505"; // Simulate duplicate key error for consistent error handling
    throw error;
  }

  const query = `
        INSERT INTO article_bookmarks (article_id, user_id)
        VALUES ($1, $2)
        RETURNING *;
    `;

  const result = await db.query(query, [article_id, user_id]);
  return result.rows[0];
};

const removeBookmark = async (articleId, userId) => {
  const query = `
        DELETE FROM article_bookmarks
        WHERE article_id = $1 AND user_id = $2
        RETURNING *;
    `;

  const result = await db.query(query, [articleId, userId]);
  return result.rows[0];
};

const getUserBookmarks = async (userId) => {
  const query = `
        SELECT ba.*, u.full_name AS author_name, u.specialization,
               COALESCE(like_counts.likes_count, 0) AS likes_count,
               COALESCE(comment_counts.comments_count, 0) AS comments_count,
               COALESCE(comment_preview.comments, '[]'::json) AS comments,
               EXISTS(
                 SELECT 1 FROM article_likes al
                 WHERE al.article_id = ba.article_id
                   AND al.user_id = $1
               ) AS user_has_liked,
               ab.created_at AS bookmarked_at
        FROM article_bookmarks ab
        JOIN blog_articles ba ON ab.article_id = ba.article_id
        JOIN users u ON ba.author_user_id = u.user_id
        LEFT JOIN (
          SELECT article_id, COUNT(*) AS likes_count
          FROM article_likes
          GROUP BY article_id
        ) AS like_counts ON like_counts.article_id = ba.article_id
        LEFT JOIN (
          SELECT article_id, COUNT(*) AS comments_count
          FROM article_comments
          GROUP BY article_id
        ) AS comment_counts ON comment_counts.article_id = ba.article_id
        LEFT JOIN LATERAL (
          SELECT json_agg(row_to_json(comment_row) ORDER BY comment_row.created_at ASC) AS comments
          FROM (
            SELECT ac.comment_id, ac.article_id, ac.user_id, ac.body, ac.created_at,
                   cu.full_name AS commenter_name, cu.role AS commenter_role
            FROM article_comments ac
            JOIN users cu ON ac.user_id = cu.user_id
            WHERE ac.article_id = ba.article_id
            ORDER BY ac.created_at ASC
          ) AS comment_row
        ) AS comment_preview ON true
        WHERE ab.user_id = $1 AND ba.status = 'active'
        ORDER BY ab.created_at DESC;
    `;
  const result = await db.query(query, [userId]);
  return result.rows;
};

const getArticleById = async (articleId) => {
  const query = `
        SELECT ba.*, u.full_name AS author_name, u.specialization,
               COALESCE(like_counts.likes_count, 0) AS likes_count
        FROM blog_articles ba
        JOIN users u ON ba.author_user_id = u.user_id
        LEFT JOIN (
          SELECT article_id, COUNT(*) AS likes_count
          FROM article_likes
          GROUP BY article_id
        ) AS like_counts ON like_counts.article_id = ba.article_id
        WHERE ba.article_id = $1;
    `;
  const result = await db.query(query, [articleId]);
  return result.rows[0];
};

const getArticleComments = async (articleId) => {
  const query = `
        SELECT ac.*, u.full_name AS commenter_name, u.role AS commenter_role
        FROM article_comments ac
        JOIN users u ON ac.user_id = u.user_id
        WHERE ac.article_id = $1
        ORDER BY ac.created_at ASC;
    `;
  const result = await db.query(query, [articleId]);
  return result.rows;
};

const likeArticle = async (articleId, userId) => {
  const alreadyLiked = await checkUserLiked(articleId, userId);
  if (alreadyLiked) {
    const error = new Error("User has already liked this article");
    error.code = "23505"; // Simulate duplicate key error for consistent error handling
    throw error;
  }

  const query = `
        INSERT INTO article_likes (article_id, user_id)
        VALUES ($1, $2)
        RETURNING *;
    `;
  const result = await db.query(query, [articleId, userId]);
  return result.rows[0];
};

const updateArticleStatus = async (articleId, status) => {
  const query = `
        UPDATE blog_articles
        SET status = $1::forum_status,
            published_at = CASE WHEN $1 = 'active' AND published_at IS NULL THEN NOW() ELSE published_at END,
            updated_at = NOW()
        WHERE article_id = $2
        RETURNING *;
    `;
  const result = await db.query(query, [status, articleId]);
  return result.rows[0];
};

const deleteArticle = async (articleId) => {
  const result = await db.query(
    `UPDATE blog_articles SET status = 'deleted', updated_at = NOW() WHERE article_id = $1 RETURNING *;`,
    [articleId],
  );
  return result.rows[0];
};

const checkUserLiked = async (articleId, userId) => {
  const query = `
    SELECT COUNT(*) as like_count
    FROM article_likes
    WHERE article_id = $1 AND user_id = $2;
  `;
  const result = await db.query(query, [articleId, userId]);
  return result.rows[0].like_count > 0;
};

module.exports = {
  createArticle,
  getArticles,
  getPendingArticles,
  addComment,
  bookmarkArticle,
  removeBookmark,
  checkUserBookmarked,
  getUserBookmarks,
  getArticleById,
  getArticleComments,
  likeArticle,
  updateArticleStatus,
  deleteArticle,
  checkUserLiked,
};
