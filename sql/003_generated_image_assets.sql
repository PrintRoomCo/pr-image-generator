-- Migration 003: reusable generated asset library for staff portal workflows

CREATE TABLE IF NOT EXISTS generated_image_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_record_id TEXT NOT NULL UNIQUE,
  job_id UUID NOT NULL REFERENCES generation_jobs(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('view', 'ecommerce', 'techpack')),
  source_item_id TEXT NOT NULL,
  source_item_name TEXT NOT NULL,
  product_label TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  workflow_type TEXT,
  preset_key TEXT,
  destination_tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  status TEXT NOT NULL DEFAULT 'generated'
    CHECK (status IN ('generated', 'selected', 'approved', 'archived')),
  storage_url TEXT NOT NULL,
  replicate_output_url TEXT,
  brief_summary TEXT,
  source_portal TEXT,
  user_id TEXT,
  user_email TEXT,
  user_display_name TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generated_image_assets_created
  ON generated_image_assets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generated_image_assets_workflow_status
  ON generated_image_assets(workflow_type, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generated_image_assets_user
  ON generated_image_assets(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_generated_image_assets_destination_tags
  ON generated_image_assets USING GIN(destination_tags);

CREATE OR REPLACE FUNCTION update_generated_image_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generated_image_assets_updated_at ON generated_image_assets;
CREATE TRIGGER generated_image_assets_updated_at
  BEFORE UPDATE ON generated_image_assets
  FOR EACH ROW EXECUTE FUNCTION update_generated_image_assets_updated_at();
