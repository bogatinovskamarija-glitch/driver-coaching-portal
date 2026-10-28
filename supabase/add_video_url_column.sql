-- Add video_url column to coaching_modules
-- Stores full embed URL: YouTube embed URL, Vimeo embed URL, or external link
ALTER TABLE coaching_modules ADD COLUMN IF NOT EXISTS video_url TEXT;
