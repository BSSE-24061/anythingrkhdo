-- Add unique constraint to prevent duplicate likes on article_likes table
-- This ensures a user can only like an article once

ALTER TABLE article_likes
ADD CONSTRAINT unique_article_user_like UNIQUE (article_id, user_id);
