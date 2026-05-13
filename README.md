# BallerZ HQ

> AI-Powered Football Intelligence Platform

![BallerZ HQ](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Stack](https://img.shields.io/badge/stack-Next.js%20%7C%20FastAPI%20%7C%20Supabase-orange)

## What is BallerZ HQ?

BallerZ HQ is your intelligent football companion that combines real football data with AI-powered insights. Select your favorite club, get match predictions, and chat with an AI that actually knows your team.

### Features

- **Match Predictions**: Win/Draw/Loss probabilities with AI-generated explanations
- **Team Dashboard**: Form guides, fixtures, standings, squad strength
- **AI Chatbot**: Two modes - Analyst (data-driven) and Hype (fan banter)
- **Analytics**: Metabase-powered dashboards for prediction accuracy and user insights
- **Zero Hallucinations**: All responses grounded in real football data

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│  Data Layer  │
│   Next.js    │     │   FastAPI    │     │              │
│   Vercel     │     │   Railway    │     │  Supabase    │
└──────────────┘     └──────────────┘     └──────────────┘
                            │                    │
                            ▼                    ▼
                     ┌──────────────┐     ┌──────────────┐
                     │  AI Layer    │     │  Analytics   │
                     │  OpenAI/Groq │     │  Metabase    │
                     └──────────────┘     └──────────────┘
```

## Tech Stack

| Layer | Technology | Hosting | Cost |
|-------|------------|---------|------|
| Frontend | Next.js + TypeScript + Tailwind | Vercel Hobby | $0 |
| Backend | FastAPI (Python) | Railway Free | $0 |
| Database | Supabase (PostgreSQL + Auth) | Supabase Free | $0 |
| Football Data | API-Football / football-data.org | Free tier | $0 |
| Squad Strength | ClubElo | Free | $0 |
| AI/LLM | OpenAI or Groq | Free tier/credits | $0 |
| Analytics | Metabase | Self-hosted on Railway | $0 |

**Total**: $0/month (student budget friendly)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Supabase account (free)
- API-Football account (free tier)
- OpenAI or Groq API key (optional for AI features)

### 1. Clone the Repository

```bash
git clone https://github.com/Mercer18/BallerZ-HQ.git
cd BallerZ-HQ
```

### 2. Database Setup (Supabase)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run `database/schema.sql`
3. Run `database/seed.sql` for initial club data
4. Copy your project URL and anon key

### 3. Frontend Setup

```bash
cd frontend
npm install

# Create .env.local
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_METABASE_DASHBOARD_URL=your-metabase-url (optional)
```

Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Create .env
cp .env.example .env
```

Edit `.env`:
```env
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-service-role-key
OPENAI_API_KEY=your-openai-key (optional)
GROQ_API_KEY=your-groq-key (optional - free tier)
FOOTBALL_API_KEY=your-football-api-key
FOOTBALL_API_BASE_URL=https://v3.football.api-sports.io
FRONTEND_URL=http://localhost:3000
```

Run development server:
```bash
uvicorn main:app --reload
```

API available at [http://localhost:8000](http://localhost:8000)

### 5. Data Ingestion

Fetch initial data from football APIs:

```bash
# In backend directory
curl -X POST http://localhost:8000/api/data/ingest/all
```

## Project Structure

```
ballerz-hq/
├── frontend/              # Next.js application
│   ├── src/
│   │   ├── app/          # App router pages
│   │   ├── components/   # Reusable components
│   │   └── lib/          # Utilities, clients
│   ├── package.json
│   └── next.config.js
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── ai/          # AI chatbot logic
│   │   ├── ml/          # Prediction model
│   │   ├── services/    # Data ingestion
│   │   └── scheduler.py # Scheduled jobs
│   ├── main.py
│   └── requirements.txt
├── database/
│   ├── schema.sql       # Database schema
│   ├── seed.sql         # Initial club data
│   └── metabase_setup.md # Analytics setup guide
└── README.md
```

## API Endpoints

### Predictions
- `POST /api/predictions/calculate` - Calculate prediction for a match
- `GET /api/predictions/upcoming` - Get upcoming match predictions

### Chat
- `POST /api/chat/` - Chat with AI assistant (Analyst or Hype mode)

### Data
- `POST /api/data/ingest/fixtures` - Fetch fixtures
- `POST /api/data/ingest/results` - Fetch results
- `POST /api/data/ingest/standings` - Fetch standings
- `POST /api/data/ingest/elo` - Update ClubElo ratings
- `POST /api/data/ingest/all` - Run full ingestion pipeline

## Scheduled Jobs

The backend runs daily scheduled jobs via APScheduler:
- **6:00 AM UTC**: Daily data refresh (fixtures, results, Elo ratings)

## Data Science Angle

This project demonstrates end-to-end data science skills:

| Competency | Implementation |
|------------|----------------|
| Data Engineering | ETL pipelines from football APIs |
| Feature Engineering | Rolling form, H2H stats, Elo ratings |
| Predictive Modeling | Win/Draw/Loss classifier |
| Model Evaluation | Accuracy tracking, Brier scores |
| Data Visualization | Recharts + Metabase dashboards |
| NLP | RAG-based chatbot |
| Product Thinking | User-centric metrics, engagement tracking |

Perfect for data science portfolios and capstone projects!

## Deployment

### Frontend (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Backend (Railway)

1. Create new project on Railway
2. Deploy from GitHub
3. Add environment variables
4. Add custom domain (optional): `api.ballerzai.com`

### Metabase (Railway)

1. Deploy from Docker image: `metabase/metabase:latest`
2. Connect to Supabase PostgreSQL
3. Create dashboards
4. Embed in frontend

## Cost Breakdown

| Service | Free Tier | Paid Tier (if needed) |
|---------|-----------|----------------------|
| Vercel | Hobby ($0) | Pro ($20/mo) |
| Railway | Free ($0) | Hobby ($5/mo) |
| Supabase | Free ($0) | Pro ($25/mo) |
| API-Football | Free (100 req/day) | Starter ($19/mo) |
| OpenAI | Free trial credits | Usage-based |
| Groq | Free tier available | - |
| Metabase | Free (OSS) | - |
| Domain | - | ~$11/year (.com) |

**MVP Cost**: $0/month (using free tiers)
**Production Cost**: ~$30-50/month

## Roadmap

- [ ] Live match updates during games
- [ ] Player statistics and injury tracking
- [ ] Transfer news integration (grounded in verified sources)
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Advanced ML model (XGBoost, neural nets)
- [ ] Social features (share predictions, challenges)

## Contributing

Contributions welcome! Please open an issue or submit a PR.

## License

MIT License - see LICENSE file for details

---

Built with ⚽ by football fans, for football fans.
