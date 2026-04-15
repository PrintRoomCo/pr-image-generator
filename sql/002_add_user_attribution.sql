-- Add user attribution columns to generation_jobs
ALTER TABLE generation_jobs
  ADD COLUMN IF NOT EXISTS user_id TEXT,
  ADD COLUMN IF NOT EXISTS user_email TEXT,
  ADD COLUMN IF NOT EXISTS user_display_name TEXT,
  ADD COLUMN IF NOT EXISTS source_portal TEXT DEFAULT 'standalone';

-- Index for filtering "my jobs"
CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_id
  ON generation_jobs(user_id) WHERE user_id IS NOT NULL;

-- Composite index for user + type filtering
CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_type
  ON generation_jobs(user_id, job_type, created_at DESC)
  WHERE user_id IS NOT NULL;
