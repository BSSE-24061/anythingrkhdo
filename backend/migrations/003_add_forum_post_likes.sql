-- Add likes_count to forum posts and create forum_post_likes table for persistent user likes.
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS forum_post_likes (
  like_id SERIAL PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES forum_posts(post_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (post_id, user_id)
);
