"""
Data ingestion endpoints — CSV-based (football-data.co.uk + FBref).

All endpoints are gated by a token (INGEST_TOKEN in env) to prevent
random callers from triggering a re-ingest. Send the token via the
X-Ingest-Token header. If INGEST_TOKEN is unset, every endpoint is
disabled.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Header, Depends
from typing import Optional
from app.config import settings
from app.services.data_ingest import (
    ingest_all_matches,
    ingest_all_players,
    compute_all_standings,
)

router = APIRouter()


def require_ingest_token(x_ingest_token: Optional[str] = Header(default=None)):
    if not settings.INGEST_TOKEN:
        raise HTTPException(403, "Ingest endpoints disabled (no INGEST_TOKEN configured)")
    if x_ingest_token != settings.INGEST_TOKEN:
        raise HTTPException(401, "Invalid ingest token")


@router.post("/ingest/matches", dependencies=[Depends(require_ingest_token)])
async def ingest_matches(background_tasks: BackgroundTasks):
    """Import all match CSVs from backend/data/matches/, then compute standings."""
    async def run():
        print("Starting match CSV ingestion...")
        results = await ingest_all_matches()
        print(f"Match ingestion complete. Total: {results.get('total', 0)}")
        print("Computing standings from match results...")
        standings = await compute_all_standings()
        print(f"Standings computed for {standings} club-seasons.")

    background_tasks.add_task(run)
    return {"status": "started", "message": "Match CSV ingestion running in background"}


@router.post("/ingest/players", dependencies=[Depends(require_ingest_token)])
async def ingest_players(background_tasks: BackgroundTasks):
    """Import all player CSVs from backend/data/players/."""
    async def run():
        print("Starting player CSV ingestion...")
        results = await ingest_all_players()
        print(f"Player ingestion complete. Total: {results.get('total', 0)}")

    background_tasks.add_task(run)
    return {"status": "started", "message": "Player CSV ingestion running in background"}


@router.post("/ingest/all", dependencies=[Depends(require_ingest_token)])
async def ingest_all_data(background_tasks: BackgroundTasks):
    """Full ingestion pipeline: matches → standings → players."""
    async def run():
        print("=" * 50)
        print("FULL DATA INGESTION PIPELINE")
        print("=" * 50)

        print("\n[1/3] Importing match CSVs...")
        match_results = await ingest_all_matches()
        print(f"  Matches imported: {match_results.get('total', 0)}")

        print("\n[2/3] Computing standings...")
        standings = await compute_all_standings()
        print(f"  Standings computed: {standings} club-seasons")

        print("\n[3/3] Importing player CSVs...")
        player_results = await ingest_all_players()
        print(f"  Players imported: {player_results.get('total', 0)}")

        print("\n" + "=" * 50)
        print("INGESTION COMPLETE")
        print("=" * 50)

    background_tasks.add_task(run)
    return {
        "status": "started",
        "message": "Full data ingestion running in background (matches → standings → players)"
    }
