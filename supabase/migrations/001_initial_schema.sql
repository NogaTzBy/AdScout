-- AdScout Database Schema
-- MVP v1.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plans table (basic structure for future)
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price DECIMAL(10, 2) DEFAULT 0,
  runs_per_month INTEGER DEFAULT -1, -- -1 = unlimited
  keywords_per_run INTEGER DEFAULT -1,
  enabled_countries TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plan for MVP (single user, unlimited)
INSERT INTO plans (name, price, runs_per_month, keywords_per_run, enabled_countries) 
VALUES ('MVP Unlimited', 0, -1, -1, ARRAY['BR', 'MX', 'CO', 'CL', 'US']);

-- Countries type
CREATE TYPE country_code AS ENUM ('BR', 'MX', 'CO', 'CL', 'US', 'AR');

-- Run status type
CREATE TYPE run_status AS ENUM ('in_progress', 'completed', 'error');

-- Runs table
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_country country_code NOT NULL,
  language TEXT NOT NULL, -- PT, ES, EN
  keywords_input TEXT[] NOT NULL,
  keywords_generated TEXT[] DEFAULT '{}',
  status run_status DEFAULT 'in_progress',
  filter_params JSONB DEFAULT '{}', -- min_active_ads, uniproduct_ratio, etc.
  summary_logs TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Candidate status type
CREATE TYPE candidate_status AS ENUM ('pending', 'approved_for_ar', 'rejected');

-- External candidates table (products found in foreign markets)
CREATE TABLE external_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
  keyword_origin TEXT NOT NULL,
  platform_origin TEXT DEFAULT 'Meta Ad Library',
  ad_library_page_url TEXT,
  advertiser_name TEXT NOT NULL,
  product_detected TEXT,
  active_ads_count INTEGER DEFAULT 0,
  uniproduct_ratio DECIMAL(3, 2) DEFAULT 0, -- 0.00 to 1.00
  duplicates_score DECIMAL(3, 2) DEFAULT 0,
  total_score INTEGER DEFAULT 0, -- 0-100
  validation_reasons TEXT,
  status candidate_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AR Validation status type
CREATE TYPE ar_validation_status AS ENUM ('not_replicated', 'replicated', 'highly_replicated');

-- AR validations table
CREATE TABLE ar_validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES external_candidates(id) ON DELETE CASCADE,
  status ar_validation_status DEFAULT 'not_replicated',
  similarity_score INTEGER DEFAULT 0, -- 0-100
  similarity_explanation TEXT,
  signals_used JSONB DEFAULT '{}', -- {landing: true, images: true, videos: false, copy: true, product_name: true}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AR replicators table (Argentina advertisers that replicate the product)
CREATE TABLE ar_replicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ar_validation_id UUID REFERENCES ar_validations(id) ON DELETE CASCADE,
  advertiser_name TEXT NOT NULL,
  ad_library_page_url TEXT,
  active_ads_count INTEGER DEFAULT 0,
  is_validated_advertiser BOOLEAN DEFAULT FALSE, -- meets min requirements (>=20 ads, uniproduct, etc.)
  match_evidence TEXT, -- brief explanation of why it matches
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Upsell extras table (suggested extras for highly replicated products)
CREATE TABLE upsell_extras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ar_validation_id UUID REFERENCES ar_validations(id) ON DELETE CASCADE,
  extra_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  combo_logic TEXT, -- why this extra complements the product
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creative cache table (to minimize OpenAI API calls)
CREATE TABLE creative_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT UNIQUE NOT NULL,
  image_hash TEXT, -- hash of image content
  analysis_result JSONB, -- OpenAI Vision response
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_runs_user_id ON runs(user_id);
CREATE INDEX idx_runs_status ON runs(status);
CREATE INDEX idx_runs_created_at ON runs(created_at DESC);
CREATE INDEX idx_external_candidates_run_id ON external_candidates(run_id);
CREATE INDEX idx_external_candidates_status ON external_candidates(status);
CREATE INDEX idx_ar_validations_candidate_id ON ar_validations(candidate_id);
CREATE INDEX idx_ar_replicators_ar_validation_id ON ar_replicators(ar_validation_id);
CREATE INDEX idx_upsell_extras_ar_validation_id ON upsell_extras(ar_validation_id);
CREATE INDEX idx_creative_cache_image_url ON creative_cache(image_url);
CREATE INDEX idx_creative_cache_image_hash ON creative_cache(image_hash);

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE runs IS 'Ad research runs by country and keywords';
COMMENT ON TABLE external_candidates IS 'Potential products found in foreign markets';
COMMENT ON TABLE ar_validations IS 'Validation of products against Argentina market';
COMMENT ON TABLE ar_replicators IS 'Argentina advertisers that replicate foreign products';
COMMENT ON TABLE upsell_extras IS 'Suggested extras/differentials for highly replicated products';
COMMENT ON TABLE creative_cache IS 'Cache for analyzed ad creatives to minimize API costs';
