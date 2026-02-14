# AdScout

Automated ad research and market validation tool for finding product opportunities across markets.

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript
- **Styling**: TailwindCSS (Apple-style dark mode)
- **Database**: Supabase (PostgreSQL)
- **Image Analysis**: OpenAI Vision API
- **Ad Scraping**: Puppeteer
- **Hosting**: Vercel (frontend) + Supabase (backend)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:
```bash
cd /Users/fedemaccio/Documents/AdScout
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Then edit `.env` with your credentials:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `OPENAI_API_KEY` - Your OpenAI API key

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Database Setup

1. Create a new Supabase project
2. Run the migration files in `supabase/migrations/` in order
3. Verify tables were created correctly

## Project Structure

```
/src
  /app              # Next.js app directory
    /api            # API routes
    /dashboard      # Dashboard pages
    /runs           # Run management pages
  /components       # React components
    /ui             # Reusable UI components
  /lib              # Core business logic
    /ad-library     # Ad Library integration
    /argentina      # AR market analysis
    /supabase       # Supabase client
```

## Features (MVP)

- ✅ Multi-country ad research (BR, MX, CO, CL, US)
- ✅ Keyword-based Ad Library search
- ✅ Advertiser validation (active ads, uniproduct detection, duplicates)
- ✅ Argentina market comparison
- ✅ Similarity scoring (0-100)
- ✅ Automated "extras" suggestions for replicated products
- ✅ Export results (CSV/JSON)

## Development Status

See `task.md` for current progress and remaining tasks.

## License

Private - Internal Use Only
