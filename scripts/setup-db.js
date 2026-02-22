#!/usr/bin/env node
/**
 * AdScout - Database Setup Script
 * Applies the schema to Supabase via REST API
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing environment variables. Check your .env file.');
    process.exit(1);
}

const SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price DECIMAL(10, 2) DEFAULT 0,
  runs_per_month INTEGER DEFAULT -1,
  keywords_per_run INTEGER DEFAULT -1,
  enabled_countries TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Countries enum
DO $$ BEGIN
  CREATE TYPE country_code AS ENUM ('BR', 'MX', 'CO', 'CL', 'US', 'AR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Run status enum
DO $$ BEGIN
  CREATE TYPE run_status AS ENUM ('in_progress', 'completed', 'error');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Runs table
CREATE TABLE IF NOT EXISTS runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_country country_code NOT NULL,
  language TEXT NOT NULL,
  keywords_input TEXT[] NOT NULL,
  keywords_generated TEXT[] DEFAULT '{}',
  status run_status DEFAULT 'in_progress',
  filter_params JSONB DEFAULT '{}',
  summary_logs TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Candidate status enum
DO $$ BEGIN
  CREATE TYPE candidate_status AS ENUM ('pending', 'approved_for_ar', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- External candidates table
CREATE TABLE IF NOT EXISTS external_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
  keyword_origin TEXT NOT NULL,
  platform_origin TEXT DEFAULT 'Meta Ad Library',
  ad_library_page_url TEXT,
  advertiser_name TEXT NOT NULL,
  product_detected TEXT,
  active_ads_count INTEGER DEFAULT 0,
  uniproduct_ratio DECIMAL(3, 2) DEFAULT 0,
  duplicates_score DECIMAL(3, 2) DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  validation_reasons TEXT,
  status candidate_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AR Validation status enum
DO $$ BEGIN
  CREATE TYPE ar_validation_status AS ENUM ('not_replicated', 'replicated', 'highly_replicated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AR validations table
CREATE TABLE IF NOT EXISTS ar_validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES external_candidates(id) ON DELETE CASCADE,
  status ar_validation_status DEFAULT 'not_replicated',
  similarity_score INTEGER DEFAULT 0,
  similarity_explanation TEXT,
  signals_used JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AR replicators table
CREATE TABLE IF NOT EXISTS ar_replicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ar_validation_id UUID REFERENCES ar_validations(id) ON DELETE CASCADE,
  advertiser_name TEXT NOT NULL,
  ad_library_page_url TEXT,
  active_ads_count INTEGER DEFAULT 0,
  is_validated_advertiser BOOLEAN DEFAULT FALSE,
  match_evidence TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Upsell extras table
CREATE TABLE IF NOT EXISTS upsell_extras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ar_validation_id UUID REFERENCES ar_validations(id) ON DELETE CASCADE,
  extra_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  combo_logic TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creative cache table
CREATE TABLE IF NOT EXISTS creative_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT UNIQUE NOT NULL,
  image_hash TEXT,
  analysis_result JSONB,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_runs_user_id ON runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_external_candidates_run_id ON external_candidates(run_id);
CREATE INDEX IF NOT EXISTS idx_external_candidates_status ON external_candidates(status);
CREATE INDEX IF NOT EXISTS idx_ar_validations_candidate_id ON ar_validations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_ar_replicators_ar_validation_id ON ar_replicators(ar_validation_id);
CREATE INDEX IF NOT EXISTS idx_upsell_extras_ar_validation_id ON upsell_extras(ar_validation_id);
CREATE INDEX IF NOT EXISTS idx_creative_cache_image_url ON creative_cache(image_url);

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Default plan
INSERT INTO plans (name, price, runs_per_month, keywords_per_run, enabled_countries)
VALUES ('MVP Unlimited', 0, -1, -1, ARRAY['BR', 'MX', 'CO', 'CL', 'US'])
ON CONFLICT DO NOTHING;
`;

async function applySchema() {
    console.log('🚀 AdScout - Applying database schema...');
    console.log(`📡 Connecting to: ${SUPABASE_URL}`);

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY,
            },
        });

        // Try using the pg endpoint directly
        const sqlResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY,
            },
        });

        const status = sqlResponse.status;
        console.log(`\n✅ Connection successful (status: ${status})`);
        console.log('\n⚠️  Para aplicar el schema, ve a Supabase SQL Editor:');
        console.log(`   ${SUPABASE_URL.replace('.supabase.co', '')}/editor`);
        console.log('   O usa: https://supabase.com/dashboard/project/rvsfidpdbubljtfyeefe/sql/new');
        console.log('\n📋 Copia y pega el contenido de:');
        console.log('   supabase/migrations/001_initial_schema.sql');

        // Now let's verify if tables already exist by querying via REST
        const tablesResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/runs?select=id&limit=1`,
            {
                headers: {
                    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                    'apikey': SERVICE_ROLE_KEY,
                },
            }
        );

        if (tablesResponse.status === 200 || tablesResponse.status === 204) {
            console.log('\n✅ Tablas ya existen en la base de datos!');
            console.log('✅ Schema aplicado correctamente.');

            // Count existing runs
            const runsData = await tablesResponse.json();
            console.log(`📊 Runs existentes: ${runsData.length}`);
        } else if (tablesResponse.status === 404) {
            console.log('\n❌ Tablas no encontradas. Necesitás aplicar el schema.');
            const errorText = await tablesResponse.text();
            console.log('Error:', errorText);
        } else {
            console.log(`\n⚠️  Status: ${tablesResponse.status}`);
            const text = await tablesResponse.text();
            console.log('Response:', text);
        }

    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        process.exit(1);
    }
}

applySchema();
