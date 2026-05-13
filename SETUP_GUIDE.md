# Local Setup Guide - BallerZ HQ

Quick start guide for running BallerZ HQ locally on your machine.

## Prerequisites Checklist

- [ ] Node.js 18+ installed ([Download](https://nodejs.org/))
- [ ] Python 3.10+ installed ([Download](https://www.python.org/))
- [ ] Supabase account created ([Sign up](https://supabase.com))
- [ ] API-Football account created ([Sign up](https://www.api-football.com/))
- [ ] Groq account (optional, for free AI) ([Sign up](https://groq.com/))

## Step 1: Supabase Setup (5 minutes)

1. **Create a new project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose your organization
   - Set a database password (save this!)
   - Wait ~2 minutes for provisioning

2. **Get your credentials**
   - Go to Settings -> API
   - Copy these values:
     - `Project URL` (e.g., `https://xyzcompany.supabase.co`)
     - `anon public` key
     - `service_role` key (secret!)

3. **Run the database schema**
   - Go to SQL Editor in Supabase dashboard
   - Click "New Query"
   - Copy the entire contents of `database/schema.sql`
   - Paste and click "Run"
   - You should see "Success. No rows returned"

4. **Seed initial club data**
   - Still in SQL Editor
   - Copy contents of `database/seed.sql`
   - Paste and run
   - You should see "Success. 42 rows affected"

5. **Verify tables exist**
   - Go to Table Editor
   - You should see: clubs, matches, predictions, user_preferences, chat_messages, etc.

## Step 2: Backend Setup (5 minutes)

1. **Navigate to backend folder**
   ```bash
   cd X:\CODING\PROJECTS\webdev\BallerZ HQ\backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment**
   ```bash
   # Windows (Git Bash)
   source venv/Scripts/activate

   # Windows (PowerShell)
   venv\Scripts\Activate.ps1

   # Mac/Linux
   source venv/bin/activate
   ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Create .env file**
   ```bash
   cp .env.example .env
   ```

6. **Edit .env with your credentials**
   ```bash
   # Open .env in your editor and fill in:
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-service-role-key
   GROQ_API_KEY=your-groq-key (get from https://console.groq.com - FREE)
   FOOTBALL_API_KEY=your-football-api-key
   ```

7. **Test the backend**
   ```bash
   uvicorn main:app --reload
   ```
   - Open http://localhost:8000 in your browser
   - You should see: `{"service": "BallerZ HQ API", "version": "0.1.0", "status": "running"}`
   - API docs at http://localhost:8000/docs

## Step 3: Frontend Setup (5 minutes)

1. **Navigate to frontend folder**
   ```bash
   cd X:\CODING\PROJECTS\webdev\BallerZ HQ\frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env.local file**
   ```bash
   cp .env.example .env.local
   ```

4. **Edit .env.local with your credentials**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   ```

5. **Test the frontend**
   ```bash
   npm run dev
   ```
   - Open http://localhost:3000 in your browser
   - You should see the BallerZ HQ homepage

## Step 4: Test the Full App

1. **Sign up for an account**
   - Go to http://localhost:3000/signup
   - Enter an email and password
   - Click Sign Up
   - You'll be redirected to onboarding

2. **Complete onboarding**
   - Select your favorite club
   - Select your favorite country
   - Click Continue

3. **Explore the dashboard**
   - You should see form guide, next fixture, league position
   - Match predictions should display
   - Navigation to Chat and Analytics should work

4. **Try the AI chat**
   - Go to /chat
   - Switch between Analyst and Hype modes
   - Send a message
   - Note: Without an API key, you'll get mock responses

## Common Issues & Fixes

### Backend won't start

**Error: ModuleNotFoundError**
```bash
# Make sure virtual environment is activated
source venv/Scripts/activate  # or equivalent for your shell
pip install -r requirements.txt
```

**Error: Supabase connection failed**
- Check SUPABASE_URL and SUPABASE_KEY in .env
- Ensure service_role key (not anon key) is used

### Frontend won't start

**Error: Module not found**
```bash
npm install
```

**Error: Supabase client not configured**
- Check NEXT_PUBLIC_SUPABASE_URL in .env.local
- Check NEXT_PUBLIC_SUPABASE_ANON_KEY

### Database errors

**Error: relation "clubs" does not exist**
- Run `database/schema.sql` in Supabase SQL Editor
- Verify tables exist in Table Editor

**Error: Row level security policy violation**
- This is expected for authenticated routes
- Make sure you're signed in to the app

## Getting API Keys

### Groq (Free AI - Recommended)
1. Go to https://console.groq.com
2. Sign up / Sign in
3. Go to API Keys
4. Create new key
5. Copy and add to backend `.env`

### API-Football (Free Tier)
1. Go to https://www.api-football.com
2. Sign up for free account
3. Go to Dashboard -> API Keys
4. Copy your key
5. Free tier: 100 requests/day

### OpenAI (Alternative to Groq)
1. Go to https://platform.openai.com
2. Sign up
3. Create API key
4. Free trial credits available

## Next Steps

1. **Trigger data ingestion** (with backend running):
   ```bash
   curl -X POST http://localhost:8000/api/data/ingest/all
   ```

2. **Check the API docs**: http://localhost:8000/docs

3. **Explore the database** in Supabase Table Editor

4. **Ready to deploy?** See `DEPLOYMENT.md`

## Project Structure Reference

```
ballerz-hq/
├── backend/           # FastAPI server (runs on port 8000)
│   ├── app/
│   │   ├── api/      # API endpoints
│   │   ├── ai/       # Chatbot logic
│   │   ├── ml/       # Prediction model
│   │   └── services/ # Data ingestion
│   ├── .env          # Backend environment variables
│   └── main.py
├── frontend/          # Next.js app (runs on port 3000)
│   ├── src/
│   │   ├── app/      # Pages
│   │   ├── components/
│   │   └── lib/      # Utilities
│   ├── .env.local    # Frontend environment variables
│   └── package.json
└── database/
    ├── schema.sql    # Run this in Supabase first
    └── seed.sql      # Run this second
```

## Development Workflow

1. Start backend: `cd backend && uvicorn main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Make changes to code
4. Refresh browser (frontend auto-reloads)
5. Backend auto-reloads on Python file changes

Happy coding! ⚽
