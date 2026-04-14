-- Migration 002: Fix double-encoded JSONB results and add safeguard
-- Context: base-pipeline.ts previously called JSON.stringify(results) before
-- passing to complete_generation_job RPC, causing results to be stored as
-- a JSON string inside JSONB rather than a proper JSONB array.

-- Step 1: Fix existing double-encoded rows
-- Note: results::text::jsonb does NOT work for JSONB strings because ::text
-- preserves the JSON string quoting. Use #>> '{}' to extract the raw text.
UPDATE generation_jobs
SET results = (results #>> '{}')::jsonb
WHERE jsonb_typeof(results) = 'string';

-- Step 2: Add trigger to auto-fix any future double-encoding
CREATE OR REPLACE FUNCTION fix_stringified_results()
RETURNS TRIGGER AS $$
BEGIN
  IF jsonb_typeof(NEW.results) = 'string' THEN
    NEW.results := (NEW.results #>> '{}')::jsonb;
    IF jsonb_typeof(NEW.results) <> 'array' THEN
      NEW.results := '[]'::jsonb;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fix_stringified_results_trigger ON generation_jobs;
CREATE TRIGGER fix_stringified_results_trigger
  BEFORE INSERT OR UPDATE ON generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION fix_stringified_results();

-- Step 3: Document the unused ecommerce images table
COMMENT ON TABLE generated_ecommerce_images IS
  'Reserved for future use. Ecommerce pipeline stores results in generation_jobs.results JSONB. '
  'product_id FK assumes catalog products but pipeline uses uploaded images — schema needs adjustment before use.';
