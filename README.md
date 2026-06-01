# BallerZ HQ

> **Your Club. Every Number.** Personalised football intelligence built on sixteen seasons of real results.

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)
![SQL](https://img.shields.io/badge/SQL-PostgreSQL%2017-4169E1?logo=postgresql&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3FCF8E?logo=supabase&logoColor=white)
![Cost](https://img.shields.io/badge/runtime-%240%2Fmonth-22c55e)

---

## About

BallerZ HQ is a full-stack football analytics platform covering Europe's top five leagues from 2010-11 to 2025-26. It combines a historical match database, computed league standings, player statistics, and an AI-powered club analyst — all running at zero cost on free-tier infrastructure.

The platform is designed around personalisation: you pick a club at onboarding, and the entire experience — dashboard stats, AI context, form tracking — reorients around that club. The AI analyst (Club IQ) is grounded in real data from the database and will only discuss facts it can verify, never hallucinating stats.

Built as a data-engineering and full-stack portfolio project to demonstrate end-to-end skills: data pipelines, SQL schema design, REST API architecture, auth flows, RAG-based AI, and responsive frontend development.

---

## What's in the database

| Dataset | Count | Source |
|---------|-------|--------|
| Matches | 28,892 | [football-data.co.uk](https://football-data.co.uk) CSVs |
| Player stats | 25,257 | [FBref](https://fbref.com) via soccerdata |
| Standings | 1,562 rows | Computed in-house from match results |
| Clubs | 186 | Auto-created during ingestion |
| Leagues | 5 | Premier League, La Liga, Serie A, Bundesliga, Ligue 1 |
| Seasons | 16 | 2010-11 to 2025-26 |

Full per-match stats: scores, half-time scores, shots, shots on target, fouls, corners, yellow/red cards, referee.

---

## Tech stack

| Layer | Technology | Hosted on | Cost |
|-------|------------|-----------|------|
| Frontend | Next.js 14 + TypeScript + Tailwind | Vercel | $0 |
| Backend | FastAPI (Python 3.10+) | Railway | $0 |
| Database | Supabase (PostgreSQL 17 + Auth + RLS) | Supabase | $0 |
| AI / LLM | Groq (LLaMA 3.3 70B) | Groq Cloud | $0 |
| Data | football-data.co.uk + FBref CSVs | Local ingest | $0 |

**Total runtime cost: $0/month.** No paid APIs. No subscriptions.

---

## Features

### Free tier (live)
- **Match Browser** — every result since 2010-11 with full per-match detail. Filter by league, season, or club.
- **League Standings** — complete tables for every season across all five leagues, computed from real match results.
- **Head-to-Head** — select any two clubs and see their full historical league record with rivalry breakdown.
- **Club Deep-Dive** — season-by-season form, goals, cards and fouls for any club in the dataset.
- **Club IQ** — AI analyst grounded in the match corpus. Analyst mode (data-driven) or Hype mode (fan energy). Only talks about your tracked club using real numbers.
- **Personalised Dashboard** — pick your club at onboarding; the entire platform reorients around it with stats, form, recent matches, and season comparison.

### Premium tier (coming soon — waitlist live)
- Advanced AI analysis modes
- Bookmaker odds overlays
- Enhanced player scouting views

---

## Architecture

```
┌────────────┐    ┌────────────┐    ┌────────────┐
│  Frontend  │───>│  Backend   │───>│  Supabase  │
│  Next.js   │    │  FastAPI   │    │ PostgreSQL │
│  (Vercel)  │    │ (Railway)  │    │  + Auth    │
└────────────┘    └────────────┘    └────────────┘
                        │
                        v
                  ┌────────────┐
                  │   Groq     │
                  │ LLaMA 3.3 │
                  └────────────┘
```

- **Frontend** handles auth (Supabase JS client), routing, and renders all dashboards and data pages.
- **Backend** is a FastAPI service exposing read endpoints for matches/standings/H2H/club stats/players, plus the RAG chat endpoint that fuses Groq with database context.
- **Supabase** stores all domain data with Row Level Security on user-scoped tables. Two clients: `anon` for public reads, `service_role` for auth-gated operations.
- **Groq** powers Club IQ with LLaMA 3.3 70B (free tier, ~280 tokens/sec).

---

## Quick start (local dev)

### Prerequisites
- Node.js 18+
- Python 3.10+
- Supabase project ([free tier](https://supabase.com))
- Groq API key ([free at console.groq.com](https://console.groq.com))

### 1. Database
```sql
-- In your Supabase SQL editor:
-- 1) Run database/schema.sql  (creates all tables, RLS policies, and functions)
-- 2) Optionally run database/seed.sql for starter club data
```

### 2. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate          # macOS / Linux
venv\Scripts\activate             # Windows

pip install -r requirements.txt
cp .env.example .env              # fill in SUPABASE_URL, SUPABASE_KEY, SUPABASE_ANON_KEY, GROQ_API_KEY

uvicorn main:app --reload --port 8001
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local        # fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_API_URL

npm run dev                       # http://localhost:3000
```

### 4. Ingest historical data (one-time)
Download CSV files from football-data.co.uk into `backend/data/matches/`, then:
```bash
export INGEST_TOKEN=any-long-random-string
# add the same INGEST_TOKEN to backend/.env

curl -X POST http://localhost:8001/api/data/ingest/all \
  -H "X-Ingest-Token: $INGEST_TOKEN"
```
This loads all matches, computes standings, and ingests player stats. Takes ~2 minutes.

---

## Project layout

```
ballerz-hq/
├── frontend/                  Next.js 14 (App Router)
│   └── src/
│       ├── app/               Pages: landing, login, signup, onboarding,
│       │                      dashboard, matches, standings, head-to-head,
│       │                      clubs, players, premium
│       ├── components/        Sidebar, AnalystPanel, CustomCursor,
│       │                      InteractiveParticles, FormChart, Skeleton, etc.
│       └── lib/               Supabase client, utilities, club color mappings
├── backend/                   FastAPI service
│   ├── app/
│   │   ├── api/               matches, players, chat, data (ingest)
│   │   ├── ai/                Chatbot (RAG: Groq + OpenAI fallback + template)
│   │   └── services/          CSV ingestion, standings computation, rate limiting
│   └── scripts/               Download helpers for match/player CSVs
├── database/
│   ├── schema.sql             Full Supabase schema (8 tables, 3 RPC functions, RLS)
│   └── seed.sql               Starter club data for development
└── README.md
```

---

## API endpoints

### Public reads (anon key)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/matches` | Browse matches — filter by `league`, `season`, `club_id` |
| GET | `/api/matches/stats?match_id=` | Full stats for a single match |
| GET | `/api/matches/standings?league=&season=` | League table for a season |
| GET | `/api/matches/standings/seasons` | Available league+season pairs |
| GET | `/api/matches/head-to-head?club_a_id=&club_b_id=` | H2H history |
| GET | `/api/matches/clubs` | All clubs (optional `league` filter) |
| GET | `/api/matches/clubs/{id}/season-stats` | Aggregated season stats |
| GET | `/api/matches/clubs/{id}/goals-history` | Goals for/against per season |
| GET | `/api/players` | Browse player stats — filter by `league`, `season`, `club_id` |
| GET | `/api/players/top` | Top N players by stat |
| GET | `/api/players/seasons` | Available player data league+season pairs |

### AI chat (service_role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | RAG chat — `{ message, mode, user_id }` |
| POST | `/api/chat/season-story` | 1-2 sentence season narrative |

### Ingestion (token-gated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/data/ingest/all` | Full pipeline: matches + standings + players |
| POST | `/api/data/ingest/matches` | Matches only |
| POST | `/api/data/ingest/players` | Players only |

---

## Security

- **Row Level Security** on `user_preferences` and `chat_messages` (user-scoped read/write)
- **Dual Supabase clients**: `anon` key for public data reads, `service_role` for auth-gated operations
- **Ingest token** gate on all `/api/data/ingest/*` endpoints
- **Rate limiting** on `/api/chat` (30 messages/hour per user)
- **CORS** allowlisted to `FRONTEND_URL`

---

## Roadmap

- [x] Phase A — Data architecture: CSV ingestion, match database, standings computation
- [x] Phase B — Frontend overhaul: dashboard, browse pages, Club IQ, player stats, design system
- [ ] Phase C — Deployment: Vercel + Railway + production config
- [ ] Phase D — Live season updates, gamification features

---

## License

MIT

---

Built by [Rishi](https://github.com/Mercer18)
