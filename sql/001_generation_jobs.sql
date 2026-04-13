-- PR Image Generator: Unified generation jobs + output tables
-- Run against the same Supabase project as print-room-studio

-- ============================================================
-- Unified generation jobs table
-- ============================================================
CREATE TABLE IF NOT EXISTS generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL CHECK (job_type IN ('view', 'ecommerce', 'techpack')),
  product_ids UUID[] NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress JSONB NOT NULL DEFAULT '{"completed": 0, "total": 0}'::jsonb,
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  error_message TEXT,
  source TEXT DEFAULT 'pr-image-generator',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_status
  ON generation_jobs(status) WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_generation_jobs_type_status
  ON generation_jobs(job_type, status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_created
  ON generation_jobs(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_generation_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generation_jobs_updated_at ON generation_jobs;
CREATE TRIGGER generation_jobs_updated_at
  BEFORE UPDATE ON generation_jobs
  FOR EACH ROW EXECUTE FUNCTION update_generation_jobs_updated_at();

-- Claim next pending job (atomic, skip-locked)
CREATE OR REPLACE FUNCTION claim_next_generation_job(p_job_type TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE job_id UUID;
BEGIN
  UPDATE generation_jobs
  SET status = 'processing', started_at = now()
  WHERE id = (
    SELECT id FROM generation_jobs
    WHERE status = 'pending'
      AND (p_job_type IS NULL OR job_type = p_job_type)
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING id INTO job_id;
  RETURN job_id;
END;
$$ LANGUAGE plpgsql;

-- Update job progress
CREATE OR REPLACE FUNCTION update_generation_progress(
  p_job_id UUID,
  p_completed INT,
  p_total INT,
  p_current_product_id UUID DEFAULT NULL,
  p_current_product_name TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  UPDATE generation_jobs
  SET progress = jsonb_build_object(
    'completed', p_completed,
    'total', p_total,
    'current_product_id', p_current_product_id,
    'current_product_name', p_current_product_name
  )
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- Complete a job
CREATE OR REPLACE FUNCTION complete_generation_job(
  p_job_id UUID,
  p_results JSONB,
  p_status TEXT DEFAULT 'completed',
  p_error_message TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  UPDATE generation_jobs
  SET status = p_status,
      results = p_results,
      error_message = p_error_message,
      completed_at = now(),
      progress = jsonb_set(progress, '{completed}', to_jsonb((progress->>'total')::int))
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Ecommerce images output table
-- ============================================================
CREATE TABLE IF NOT EXISTS generated_ecommerce_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  image_type TEXT NOT NULL CHECK (image_type IN ('lifestyle', 'white-background', 'hero', 'size-guide')),
  file_url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generated_ecommerce_images_product
  ON generated_ecommerce_images(product_id, image_type);

-- ============================================================
-- Tech pack assets output table
-- ============================================================
CREATE TABLE IF NOT EXISTS generated_techpack_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  asset_type TEXT NOT NULL CHECK (asset_type IN ('flat-drawing', 'construction-detail', 'measurement-diagram', 'fabric-callout', 'color-spec')),
  file_url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generated_techpack_assets_product
  ON generated_techpack_assets(product_id, asset_type);
