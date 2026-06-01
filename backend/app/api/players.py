"""
Player stats API — browse FBref player data by league, season, and club.
"""

from fastapi import APIRouter, Query
from typing import Optional
from app.database import supabase_anon as supabase

router = APIRouter()


@router.get("/")
async def get_players(
    league: Optional[str] = None,
    season: Optional[int] = None,
    club_id: Optional[int] = None,
    sort: str = Query(default="goals", regex="^(goals|assists|matches_played|minutes|yellow_cards|red_cards)$"),
    limit: int = Query(default=50, le=200),
    offset: int = 0,
):
    """Browse player stats with filters. Sorted by the chosen stat descending."""
    query = supabase.table("player_stats").select(
        "id, player_name, nation, position, age, team_name, league, season, "
        "matches_played, starts, minutes, goals, assists, "
        "yellow_cards, red_cards, club_id"
    )

    if league:
        query = query.eq("league", league)
    if season is not None:
        query = query.eq("season", season)
    if club_id is not None:
        query = query.eq("club_id", club_id)

    query = query.order(sort, desc=True).range(offset, offset + limit - 1)
    result = query.execute()
    return result.data or []


@router.get("/top")
async def top_players(
    league: Optional[str] = None,
    season: Optional[int] = None,
    stat: str = Query(default="goals", regex="^(goals|assists|matches_played|minutes|yellow_cards|red_cards)$"),
    limit: int = Query(default=20, le=50),
):
    """Top N players across a league+season for a given stat."""
    query = supabase.table("player_stats").select(
        "player_name, position, team_name, league, season, "
        "matches_played, starts, minutes, goals, assists, yellow_cards, red_cards"
    )

    if league:
        query = query.eq("league", league)
    if season is not None:
        query = query.eq("season", season)

    query = query.gt(stat, 0).order(stat, desc=True).limit(limit)
    result = query.execute()
    return result.data or []


_player_seasons_cache = None

@router.get("/seasons")
async def player_seasons():
    """Return distinct league+season pairs that have player data."""
    global _player_seasons_cache
    if _player_seasons_cache is not None:
        return _player_seasons_cache

    pairs = set()
    offset = 0
    page_size = 1000
    while True:
        batch = (
            supabase.table("player_stats")
            .select("league, season")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        if not batch.data:
            break
        for row in batch.data:
            if row.get("league") and row.get("season") is not None:
                pairs.add((row["league"], row["season"]))
        if len(batch.data) < page_size:
            break
        offset += page_size

    _player_seasons_cache = sorted(
        [{"league": l, "season": s} for l, s in pairs],
        key=lambda x: (-x["season"], x["league"]),
    )
    return _player_seasons_cache
