"""
Scheduled jobs for data ingestion and prediction updates
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app.services.data_ingest import fetch_fixtures, fetch_results, update_club_elo

scheduler = BackgroundScheduler()

import asyncio

def run_daily_ingestion():
    """Daily data refresh for major leagues"""
    print("Running scheduled data ingestion...")

    leagues = [
        (39, 2025),   # Premier League
        (140, 2025),  # La Liga
        (78, 2025),   # Bundesliga
        (135, 2025),  # Serie A
        (61, 2025),   # Ligue 1
    ]

    async def _run():
        for league_id, season in leagues:
            try:
                await fetch_results(league_id, season)
                await fetch_fixtures(league_id, season)
                print(f"Updated league {league_id}")
            except Exception as e:
                print(f"Error updating league {league_id}: {e}")

        await update_club_elo()

    asyncio.run(_run())
    print("Scheduled ingestion complete")

def start_scheduled_jobs():
    """Start the background scheduler"""

    # Daily ingestion at 6 AM UTC
    scheduler.add_job(
        run_daily_ingestion,
        CronTrigger(hour=6, minute=0),
        id='daily_ingestion',
        replace_existing=True
    )

    scheduler.start()
    print("Scheduler started - daily ingestion at 6 AM UTC")
