# Deployment Guide

## Overview

This guide walks you through deploying BallerZ HQ to free hosting services.

## Prerequisites

- GitHub account
- Supabase account (free)
- Railway account (free)
- Vercel account (free)
- API-Football account (free tier)
- OpenAI or Groq API key (optional)

## Step 1: Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project credentials:
   - Project URL: `https://<ref>.supabase.co`
   - Anon Key (public): Found in Settings -> API
   - Service Role Key (secret): Found in Settings -> API

3. Run the schema:
   - Go to SQL Editor
   - Copy contents of `database/schema.sql`
   - Paste and run

4. Seed initial data:
   - Copy contents of `database/seed.sql`
   - Paste and run

5. Enable Auth:
   - Go to Authentication -> Providers
   - Enable Email/Password
   - Configure email templates (optional)

## Step 2: Backend Deployment (Railway)

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/ballerz-hq.git
   git push -u origin main
   ```

2. Deploy to Railway:
   - Go to [railway.app](https://railway.app)
   - New Project -> Deploy from GitHub
   - Select `ballerz-hq` repository
   - Select `backend` as the root directory

3. Add environment variables in Railway:
   ```
   SUPABASE_URL=https://<ref>.supabase.co
   SUPABASE_KEY=<service-role-key>
   OPENAI_API_KEY=<your-key> (optional)
   GROQ_API_KEY=<your-groq-key> (recommended - free tier)
   FOOTBALL_API_KEY=<your-football-api-key>
   FOOTBALL_API_BASE_URL=https://v3.football.api-sports.io
   FRONTEND_URL=http://localhost:3000
   ```

4. Add a `Procfile` for Railway:
   ```
   web: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

5. Deploy! Railway will automatically detect Python and deploy.

6. Note your Railway URL: `https://ballerz-hq-production.up.railway.app`

## Step 3: Frontend Deployment (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign in

2. Import your GitHub repository

3. Configure build settings:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   NEXT_PUBLIC_BACKEND_URL=https://<your-railway-url>
   NEXT_PUBLIC_METABASE_DASHBOARD_URL=<metabase-url> (optional)
   ```

5. Deploy!

6. Your frontend is live at: `https://ballerz-hq.vercel.app`

## Step 4: Metabase Setup (Optional but Recommended)

See `database/metabase_setup.md` for detailed instructions.

Quick setup:
1. Railway -> New Project -> Deploy from Docker Image
2. Image: `metabase/metabase:latest`
3. Connect to your Supabase database
4. Create dashboards
5. Get embed URL and add to Vercel env vars

## Step 5: Update CORS Settings

In `backend/main.py`, update the CORS allowed origins:

```python
allow_origins=[
    "http://localhost:3000",
    "https://ballerz-hq.vercel.app",  # Your Vercel URL
    "https://ballerzai.com",  # When you buy the domain
],
```

## Step 6: Trigger Initial Data Ingestion

Use Railway's shell or curl to trigger data ingestion:

```bash
curl -X POST https://<your-railway-url>/api/data/ingest/all
```

Or use the scheduled job (runs daily at 6 AM UTC).

## Step 7: Test Everything

1. **Sign up**: Go to your Vercel URL -> Sign Up
2. **Onboarding**: Select your favorite club and country
3. **Dashboard**: Check if stats load
4. **Predictions**: Navigate to predictions page
5. **Chat**: Try the AI assistant (Analyst and Hype modes)
6. **Analytics**: View Metabase dashboards (if set up)

## Troubleshooting

### Frontend can't connect to backend
- Check CORS settings in `backend/main.py`
- Ensure `NEXT_PUBLIC_BACKEND_URL` is correct in Vercel
- Check Railway logs for errors

### Database errors
- Verify Supabase credentials
- Check RLS policies in schema.sql
- Ensure schema and seed data are loaded

### AI chatbot not responding
- Check if API key is set (OpenAI or Groq)
- Without API key, mock responses are returned
- Check Railway logs for errors

### Data not showing up
- Trigger manual ingestion: `POST /api/data/ingest/all`
- Check Railway logs for API errors
- Verify football API key is valid

## Custom Domain (Optional)

### Frontend Domain

1. Buy domain: `ballerzai.com` (~$11/year on Namecheap)
2. Vercel -> Project Settings -> Domains
3. Add `ballerzai.com` and `www.ballerzai.com`
4. Update DNS records as instructed

### Backend Domain

1. Railway -> Settings -> Domains
2. Add `api.ballerzai.com`
3. Update frontend `.env`:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://api.ballerzai.com
   ```

## Cost Summary

| Service | Free Tier | When to Upgrade |
|---------|-----------|-----------------|
| Vercel | Hobby ($0) | >100GB bandwidth |
| Railway | Free ($0) | Need more resources |
| Supabase | Free ($0) | >500MB database |
| API-Football | Free (100/day) | Need more requests |
| Groq | Free tier | - |
| Domain | - | ~$11/year |

**Total**: $0/month until you need more resources!

## Next Steps

1. Set up monitoring (Railway logs, Vercel analytics)
2. Configure automated deployments (GitHub -> Vercel/Railway)
3. Set up error tracking (Sentry - free tier)
4. Add user analytics (Metabase)
5. Buy custom domain when ready for public launch
