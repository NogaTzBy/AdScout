# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization
4. Set project name: `adscout` or similar
5. Set database password (save it securely)
6. Choose region (preferably closest to your location)
7. Wait for project to initialize (~2 minutes)

## Step 2: Get Credentials

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** → `anon` `public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Project API keys** → `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

3. Create `.env` file in project root:
```bash
cd /Users/fedemaccio/Documents/AdScout
cp .env.example .env
```

4. Edit `.env` and paste your credentials

## Step 3: Apply Database Schema

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New query**
3. Open `supabase/migrations/001_initial_schema.sql`
4. Copy the entire contents
5. Paste into SQL Editor
6. Click **Run** (or press Ctrl/Cmd + Enter)
7. Verify: Go to **Table Editor** and confirm all tables exist:
   - users
   - plans
   - runs
   - external_candidates
   - ar_validations
   - ar_replicators
   - upsell_extras
   - creative_cache

### Option B: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migration
supabase db push
```

## Step 4: Verify Setup

Run this query in SQL Editor to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see all 8 tables listed.

## Step 5: Test Connection

1. Make sure `.env` is configured
2. Run the dev server:
```bash
npm run dev
```

3. Open browser console and test connection (we'll add a test endpoint later)

## Troubleshooting

**Error: relation "uuid-ossp" does not exist**
- The extension should auto-install. If not, run manually:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

**Error: permission denied**
- Make sure you're using the SQL Editor with admin privileges
- Or verify your service role key is correct

**Tables not showing in Table Editor**
- Refresh the page
- Check SQL Editor for any error messages during migration

## Next Steps

Once setup is complete:
- ✅ Database schema applied
- ✅ Environment variables configured
- ✅ Connection tested
- → Ready to build core features!
