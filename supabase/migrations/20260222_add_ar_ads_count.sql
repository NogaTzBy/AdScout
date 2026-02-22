-- migration to add AR ads count to external_candidates table
ALTER TABLE external_candidates
ADD COLUMN IF NOT EXISTS ar_ads_count INTEGER DEFAULT NULL;
