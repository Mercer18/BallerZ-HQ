"""
Matches & standings API — browse historical football data
"""

from fastapi import APIRouter, Query
from typing import Optional, List
from app.database import supabase_anon as supabase

router = APIRouter()


@router.get("/")
async def get_matches(
    league: Optional[str] = None,
    season: Optional[int] = None,
    club_id: Optional[int] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
):
    """
    Browse historical matches with optional filters.
    """
    query = supabase.table("matches").select(
        "*, home_club:home_club_id(id, name, logo), away_club:away_club_id(id, name, logo)"
    )

    if league:
        query = query.eq("league_name", league)
    if season:
        query = query.eq("season", season)
    if club_id:
        query = query.or_(f"home_club_id.eq.{club_id},away_club_id.eq.{club_id}")

    query = query.order("match_date", desc=True).range(offset, offset + limit - 1)
    result = query.execute()
    return result.data


@router.get("/stats")
async def get_match_stats(match_id: int):
    """Get full stats for a single match."""
    result = (
        supabase.table("matches")
        .select("*, home_club:home_club_id(id, name, logo), away_club:away_club_id(id, name, logo)")
        .eq("id", match_id)
        .single()
        .execute()
    )
    return result.data


@router.get("/head-to-head")
async def head_to_head(club_a_id: int, club_b_id: int, limit: int = 20):
    """Get head-to-head history between two clubs."""
    result = (
        supabase.table("matches")
        .select("*, home_club:home_club_id(id, name), away_club:away_club_id(id, name)")
        .or_(
            f"and(home_club_id.eq.{club_a_id},away_club_id.eq.{club_b_id}),"
            f"and(home_club_id.eq.{club_b_id},away_club_id.eq.{club_a_id})"
        )
        .order("match_date", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data


@router.get("/standings")
async def get_standings(league: str, season: int):
    """Get league standings for a specific season."""
    result = (
        supabase.table("standings_history")
        .select("*, club:club_id(id, name, logo)")
        .eq("league", league)
        .eq("season", season)
        .order("position", desc=False)
        .execute()
    )
    return result.data


@router.get("/standings/seasons")
async def get_available_seasons():
    """Get list of available league+season combinations."""
    result = supabase.rpc("get_standings_league_seasons").execute()
    return result.data


@router.get("/clubs")
async def get_clubs(league: Optional[str] = None):
    """List clubs that actually have matches (filters out ghost/duplicate rows),
    optionally filtered by league. Uses the get_active_clubs() Postgres function."""
    result = supabase.rpc("get_active_clubs", {"p_league": league}).execute()
    return result.data


@router.get("/clubs/{club_id}/season-stats")
async def club_season_stats(club_id: int, season: Optional[int] = None):
    """Get aggregated stats for a club across a season."""
    query = (
        supabase.table("matches")
        .select("home_club_id, away_club_id, home_score, away_score, match_date, "
                "home_shots, away_shots, home_fouls, away_fouls, "
                "home_yellow_cards, away_yellow_cards, home_red_cards, away_red_cards")
        .or_(f"home_club_id.eq.{club_id},away_club_id.eq.{club_id}")
        .eq("status", "finished")
    )
    if season:
        query = query.eq("season", season)

    result = query.order("match_date", desc=True).execute()

    # Aggregate
    stats = {
        "played": 0, "won": 0, "drawn": 0, "lost": 0,
        "goals_for": 0, "goals_against": 0,
        "yellow_cards": 0, "red_cards": 0,
        "shots": 0, "fouls": 0,
    }

    for m in result.data:
        is_home = m["home_club_id"] == club_id
        gf = m["home_score"] if is_home else m["away_score"]
        ga = m["away_score"] if is_home else m["home_score"]

        if gf is None or ga is None:
            continue

        stats["played"] += 1
        stats["goals_for"] += gf
        stats["goals_against"] += ga

        if gf > ga:
            stats["won"] += 1
        elif gf == ga:
            stats["drawn"] += 1
        else:
            stats["lost"] += 1

        # Stat columns (may be None for older seasons)
        shots = (m.get("home_shots") if is_home else m.get("away_shots")) or 0
        fouls = (m.get("home_fouls") if is_home else m.get("away_fouls")) or 0
        yc = (m.get("home_yellow_cards") if is_home else m.get("away_yellow_cards")) or 0
        rc = (m.get("home_red_cards") if is_home else m.get("away_red_cards")) or 0

        stats["shots"] += shots
        stats["fouls"] += fouls
        stats["yellow_cards"] += yc
        stats["red_cards"] += rc

    stats["points"] = stats["won"] * 3 + stats["drawn"]
    stats["goal_difference"] = stats["goals_for"] - stats["goals_against"]
    return stats


@router.get("/clubs/{club_id}/goals-history")
async def club_goals_history(club_id: int, seasons: int = Query(default=5, le=15)):
    """Goals for/against per season for the last N seasons."""
    result = (
        supabase.table("matches")
        .select("season, home_club_id, away_club_id, home_score, away_score")
        .or_(f"home_club_id.eq.{club_id},away_club_id.eq.{club_id}")
        .eq("status", "finished")
        .execute()
    )

    by_season: dict = {}
    for m in result.data:
        s = m.get("season")
        if s is None:
            continue
        if s not in by_season:
            by_season[s] = {"season": s, "goals_for": 0, "goals_against": 0}
        is_home = m["home_club_id"] == club_id
        gf = m["home_score"] if is_home else m["away_score"]
        ga = m["away_score"] if is_home else m["home_score"]
        if gf is None or ga is None:
            continue
        by_season[s]["goals_for"] += gf
        by_season[s]["goals_against"] += ga

    recent = sorted(by_season.values(), key=lambda x: x["season"], reverse=True)[:seasons]
    return sorted(recent, key=lambda x: x["season"])



