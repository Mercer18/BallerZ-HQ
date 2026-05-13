"""
Data ingestion endpoints - fetch from football APIs
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.services.data_ingest import (
    fetch_fixtures,
    fetch_results,
    fetch_standings,
    update_club_elo,
)

router = APIRouter()

@router.post("/ingest/fixtures")
async def ingest_fixtures(league_id: int = 39, season: int = 2025):
    """
    Fetch fixtures from football API.
    league_id: 39 = Premier League, 140 = La Liga, etc.
    """
    try:
        count = await fetch_fixtures(league_id, season)
        return {"status": "success", "fixtures_ingested": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ingest/results")
async def ingest_results(league_id: int = 39, season: int = 2025):
    """
    Fetch completed match results from football API.
    """
    try:
        count = await fetch_results(league_id, season)
        return {"status": "success", "results_ingested": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ingest/standings")
async def ingest_standings(league_id: int = 39, season: int = 2025):
    """
    Fetch league standings from football API.
    """
    try:
        count = await fetch_standings(league_id, season)
        return {"status": "success", "teams_updated": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ingest/elo")
async def ingest_elo_ratings():
    """
    Fetch ClubElo ratings for squad strength.
    """
    try:
        count = await update_club_elo()
        return {"status": "success", "clubs_updated": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ingest/all")
async def ingest_all_data(background_tasks: BackgroundTasks):
    """
    Trigger full data ingestion pipeline.
    Runs in background to avoid timeout.
    """
    async def run_ingestion():
        leagues = [(39, 2025), (140, 2025), (78, 2025)]  # Premier League, La Liga, Bundesliga
        total = 0
        for league_id, season in leagues:
            try:
                await fetch_fixtures(league_id, season)
                await fetch_results(league_id, season)
                await fetch_standings(league_id, season)
                total += 1
            except Exception as e:
                print(f"Error ingesting league {league_id}: {e}")

        await update_club_elo()
        print(f"Ingestion complete. Leagues processed: {total}")

    background_tasks.add_task(run_ingestion)

    return {"status": "started", "message": "Data ingestion running in background"}
