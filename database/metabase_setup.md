# Metabase Analytics Setup Guide

## Why Metabase (Not Power BI)

| Factor | Metabase | Power BI |
|--------|----------|----------|
| Cost | Free (OSS) | $10/user/month |
| Self-host | Yes (Railway free tier) | No |
| Web embed | Free | Paid |
| Student budget friendly | Yes | No |

## Setup Steps

### 1. Deploy Metabase on Railway

```bash
# In Railway dashboard:
# 1. New Project -> Deploy from Docker Image
# 2. Image: metabase/metabase:latest
# 3. Set environment variables:
MB_DB_TYPE=postgres
MB_DB_DBNAME=metabase
MB_DB_PORT=5432
MB_DB_USER=postgres
MB_DB_PASS=<your-railway-db-password>
MB_DB_HOST=<your-railway-db-host>
```

### 2. Connect Metabase to Supabase

1. Open Metabase at your Railway URL
2. Go to Admin Settings -> Databases -> Add Database
3. Select PostgreSQL
4. Enter Supabase connection details:
   - Host: `db.<project-ref>.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - User: `postgres` (or service role user)
   - Password: Your Supabase service role password

### 3. Create Dashboards

Recommended dashboards for BallerZ HQ:

1. **User Analytics**
   - New signups over time
   - Daily active users
   - Most popular clubs/countries

2. **Prediction Accuracy**
   - Win/Draw/Loss prediction accuracy over time
   - Brier score tracking
   - Confidence vs actual results

3. **Engagement Metrics**
   - Chat messages per user
   - Dashboard views
   - Feature usage

4. **Football Data Overview**
   - Matches processed
   - Leagues covered
   - Data freshness

### 4. Embed in Frontend

Get the public embed URL from Metabase:
1. Go to dashboard -> Click "Share" -> "Public link"
2. Copy the embed URL
3. Add to `.env`:
   ```
   NEXT_PUBLIC_METABASE_DASHBOARD_URL=<your-embed-url>
   ```

### 5. Alternative: Metabase on Render

If Railway free tier is insufficient:
1. Render.com -> New Web Service
2. Docker image: `metabase/metabase:latest`
3. Free tier: 512MB RAM, limited hours
4. Connect to external PostgreSQL (Supabase)

## Sample SQL Queries for Dashboards

```sql
-- New users per day
SELECT DATE_TRUNC('day', created_at) as day, COUNT(*) as new_users
FROM auth.users
GROUP BY day
ORDER BY day;

-- Most popular clubs
SELECT c.name, COUNT(*) as user_count
FROM user_preferences up
JOIN clubs c ON up.favorite_club_id = c.id
GROUP BY c.id, c.name
ORDER BY user_count DESC;

-- Prediction accuracy by confidence level
SELECT confidence,
       COUNT(*) as total_predictions,
       SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct,
       ROUND(100.0 * SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) / COUNT(*), 2) as accuracy_pct
FROM predictions
WHERE actual_result IS NOT NULL
GROUP BY confidence;

-- Chat activity per user
SELECT u.email, COUNT(cm.id) as message_count
FROM chat_messages cm
JOIN auth.users u ON cm.user_id = u.id
GROUP BY u.id, u.email
ORDER BY message_count DESC;
```

## Data Science Portfolio Value

This setup demonstrates:
- **Data Engineering**: ETL pipelines from football APIs
- **Data Warehousing**: PostgreSQL schema design
- **BI/Analytics**: Metabase dashboard creation
- **Product Thinking**: Metrics that matter for user engagement
- **Full-Stack DS**: From data ingestion to user-facing insights

Export these dashboards as part of your course portfolio!
