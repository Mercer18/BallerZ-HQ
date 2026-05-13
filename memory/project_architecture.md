---
name: BallerZ HQ Project Architecture
description: Complete architecture, zero-cost stack, and feature list for BallerZ HQ football analytics platform
type: project
---

## BallerZ HQ Architecture Summary

**Brand:** BallerZ HQ
**Domain:** ballerzai.com (using free preview URLs until public launch)
**Budget:** $0/month (student project)

### Stack
- Frontend: Next.js + TypeScript + Tailwind on Vercel Hobby (free)
- Backend: FastAPI (Python) on Railway Free tier
- Database: Supabase Free tier (PostgreSQL + Auth)
- Football Data: API-Football free tier (100 req/day) or football-data.org
- Squad Strength: ClubElo (free, no auth)
- AI/LLM: OpenAI free trial credits or Groq free tier (Llama models)
- Analytics: Metabase self-hosted on Railway Free (not Power BI - requires $10/user/month)

### Core Features
1. Auth + onboarding (select favorite club/country)
2. Dashboard (form, fixtures, standings, squad strength)
3. Match predictions (win/draw/loss %, scorelines, AI explanations)
4. AI chatbot (Analyst Mode + Hype Mode, RAG-based from DB)
5. Metabase analytics dashboards (user growth, prediction accuracy, engagement)
6. Scheduled data pipelines (daily refresh, post-match updates)

### Data Science Angle
- ETL pipelines, feature engineering, predictive modeling
- Model evaluation (accuracy tracking, Brier scores)
- Data visualization (Recharts + Metabase)
- NLP (RAG chatbot)
- Full end-to-end DS project for portfolio/capstone

### Why Metabase over Power BI
- Power BI Service requires $10/user/month for cloud sharing
- Metabase is free, self-hostable, web-native, embeddable
- Better fit for student budget and web app integration