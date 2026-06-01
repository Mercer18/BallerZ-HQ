"""
Data ingestion services — CSV-based (football-data.co.uk + FBref)
No external API calls at runtime. All data comes from local CSV files.
"""

import csv
import os
from datetime import datetime
from typing import Dict, Optional

from app.database import supabase

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")
MATCHES_DIR = os.path.join(DATA_DIR, "matches")
PLAYERS_DIR = os.path.join(DATA_DIR, "players")

# FBref team name -> our DB club name (only where they differ)
FBREF_TEAM_MAP: Dict[str, str] = {
    # Premier League
    "Manchester Utd": "Manchester United",
    "Tottenham Hotspur": "Tottenham",
    "Newcastle Utd": "Newcastle United",
    "Leicester City": "Leicester",
    "Norwich City": "Norwich",
    "Leeds United": "Leeds",
    "Huddersfield Town": "Huddersfield",
    "Cardiff City": "Cardiff",
    "Ipswich Town": "Ipswich",
    "Luton Town": "Luton",
    "Stoke City": "Stoke",
    "Swansea City": "Swansea",
    "West Ham United": "West Ham",
    "Nottingham Forest": "Nott'm Forest",
    # La Liga
    "Atlético Madrid": "Atletico Madrid",
    "Atlético Madrid": "Atletico Madrid",
    "Celta Vigo": "Celta",
    "Dep La Coruña": "La Coruna",
    "Dep La Coruña": "La Coruna",
    "Alavés": "Alaves",
    "Alavés": "Alaves",
    "Almería": "Almeria",
    "Almería": "Almeria",
    "Cádiz": "Cadiz",
    "Cádiz": "Cadiz",
    "Leganés": "Leganes",
    "Leganés": "Leganes",
    "Málaga": "Malaga",
    "Málaga": "Malaga",
    "Rayo Vallecano": "Vallecano",
    "Real Betis": "Betis",
    "Espanyol": "Espanol",
    # Bundesliga
    "Eintracht Frankfurt": "Ein Frankfurt",
    "Gladbach": "M'gladbach",
    "Köln": "FC Koln",
    "Köln": "FC Koln",
    "Mainz 05": "Mainz",
    "Hannover 96": "Hannover",
    "Hamburger SV": "Hamburg",
    "Nürnberg": "Nurnberg",
    "Nürnberg": "Nurnberg",
    "Greuther Fürth": "Greuther Furth",
    "Greuther Fürth": "Greuther Furth",
    "Düsseldorf": "Fortuna Dusseldorf",
    "Düsseldorf": "Fortuna Dusseldorf",
    "Darmstadt 98": "Darmstadt",
    "Paderborn 07": "Paderborn",
    "Arminia": "Bielefeld",
    "Hertha BSC": "Hertha Berlin",
    "Leverkusen": "Bayer Leverkusen",
    "Dortmund": "Borussia Dortmund",
    # Serie A
    "Hellas Verona": "Verona",
    "SPAL": "Spal",
    "Roma": "AS Roma",
    "Milan": "AC Milan",
    "Inter": "Inter Milan",
    # Ligue 1
    "Paris Saint-Germain": "Paris Saint Germain",
    "Saint-Étienne": "St Etienne",
    "Saint-Étienne": "St Etienne",
    "Nîmes": "Nimes",
    "Nîmes": "Nimes",
    "Clermont Foot": "Clermont",
    "Evian Thonon Gaillard": "Evian Thonon Gaillard",
}

# football-data.co.uk short name -> our canonical DB club name (only where they differ).
# Without this, the match ingest creates DUPLICATE club rows for teams the DB stores
# under their full/FBref-style names (e.g. "Man City" vs "Manchester City"), severing
# 2025-26 data from each club's history.
FOOTBALLDATA_TEAM_MAP: Dict[str, str] = {
    # Premier League
    "Man City": "Manchester City",
    "Man United": "Manchester United",
    "Newcastle": "Newcastle United",
    "Nott'm Forest": "Nottingham Forest",
    # La Liga
    "Ath Bilbao": "Athletic Club",
    "Ath Madrid": "Atletico Madrid",
    "Sociedad": "Real Sociedad",
    "Betis": "Real Betis",
    "Celta": "Celta Vigo",
    "Espanol": "Espanyol",
    "Vallecano": "Rayo Vallecano",
    "Oviedo": "Real Oviedo",
    # Serie A
    "Milan": "AC Milan",
    "Roma": "AS Roma",
    "Inter": "Inter Milan",
    # Bundesliga
    "Dortmund": "Borussia Dortmund",
    "Leverkusen": "Bayer Leverkusen",
    # Ligue 1
    "Paris SG": "Paris Saint Germain",
}

LEAGUE_MAP: Dict[str, dict] = {
    "E0":  {"name": "Premier League", "country": "England"},
    "SP1": {"name": "La Liga",        "country": "Spain"},
    "D1":  {"name": "Bundesliga",     "country": "Germany"},
    "I1":  {"name": "Serie A",        "country": "Italy"},
    "F1":  {"name": "Ligue 1",        "country": "France"},
}

# Map season code in filename to season year (start year of the season)
SEASON_CODE_TO_YEAR: Dict[str, int] = {
    "1011": 2010, "1112": 2011, "1213": 2012, "1314": 2013,
    "1415": 2014, "1516": 2015, "1617": 2016, "1718": 2017,
    "1819": 2018, "1920": 2019, "2021": 2020, "2122": 2021,
    "2223": 2022, "2324": 2023, "2425": 2024, "2526": 2025,
}

# ── Club name cache (name → internal id) ────────────────────────────
_club_cache: Dict[str, int] = {}


def _ensure_club(name: str, league: str, country: str) -> int:
    """Find or create a club by name. Returns internal clubs.id."""
    cache_key = name.lower().strip()
    if cache_key in _club_cache:
        return _club_cache[cache_key]

    # Try exact match first
    result = supabase.table("clubs").select("id").eq("name", name).execute()
    if result.data:
        _club_cache[cache_key] = result.data[0]["id"]
        return result.data[0]["id"]

    # Try case-insensitive match
    result = supabase.table("clubs").select("id").ilike("name", name).execute()
    if result.data:
        _club_cache[cache_key] = result.data[0]["id"]
        return result.data[0]["id"]

    # Create new club
    result = supabase.table("clubs").insert({
        "name": name,
        "league": league,
        "country": country,
    }).execute()
    club_id = result.data[0]["id"]
    _club_cache[cache_key] = club_id
    return club_id


def _safe_int(value: str) -> Optional[int]:
    """Parse an int from CSV, returning None if empty/invalid."""
    if not value or not value.strip():
        return None
    try:
        return int(float(value.strip()))
    except (ValueError, TypeError):
        return None


def _parse_date(date_str: str) -> Optional[str]:
    """Parse date from football-data.co.uk (DD/MM/YYYY or DD/MM/YY)."""
    date_str = date_str.strip()
    if not date_str:
        return None
    for fmt in ("%d/%m/%Y", "%d/%m/%y"):
        try:
            return datetime.strptime(date_str, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


async def ingest_match_csv(filepath: str, league_code: str, season: int) -> int:
    """Ingest a single football-data.co.uk CSV into the database."""
    league_info = LEAGUE_MAP.get(league_code, {"name": league_code, "country": "Unknown"})
    league_name = league_info["name"]
    country = league_info["country"]

    # Delete existing matches for this league and season to ensure idempotency
    try:
        supabase.table("matches").delete().eq("league_name", league_name).eq("season", season).execute()
    except Exception as e:
        print(f"  [WARN] Failed to clear existing matches: {e}")

    count = 0
    with open(filepath, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            home_team = row.get("HomeTeam", "").strip()
            away_team = row.get("AwayTeam", "").strip()
            if not home_team or not away_team:
                continue

            # Normalize football-data short names to our canonical club names
            home_team = FOOTBALLDATA_TEAM_MAP.get(home_team, home_team)
            away_team = FOOTBALLDATA_TEAM_MAP.get(away_team, away_team)

            home_id = _ensure_club(home_team, league_name, country)
            away_id = _ensure_club(away_team, league_name, country)

            match_date = _parse_date(row.get("Date", ""))
            fthg = _safe_int(row.get("FTHG", ""))
            ftag = _safe_int(row.get("FTAG", ""))

            match_data = {
                "home_club_id": home_id,
                "away_club_id": away_id,
                "match_date": match_date,
                "status": "finished",
                "home_score": fthg,
                "away_score": ftag,
                "season": season,
                "league_name": league_name,
                # Half-time
                "half_time_home_score": _safe_int(row.get("HTHG", "")),
                "half_time_away_score": _safe_int(row.get("HTAG", "")),
                # Referee
                "referee": row.get("Referee", "").strip() or None,
                # Shots
                "home_shots": _safe_int(row.get("HS", "")),
                "away_shots": _safe_int(row.get("AS", "")),
                "home_shots_on_target": _safe_int(row.get("HST", "")),
                "away_shots_on_target": _safe_int(row.get("AST", "")),
                # Fouls
                "home_fouls": _safe_int(row.get("HF", "")),
                "away_fouls": _safe_int(row.get("AF", "")),
                # Corners
                "home_corners": _safe_int(row.get("HC", "")),
                "away_corners": _safe_int(row.get("AC", "")),
                # Cards
                "home_yellow_cards": _safe_int(row.get("HY", "")),
                "away_yellow_cards": _safe_int(row.get("AY", "")),
                "home_red_cards": _safe_int(row.get("HR", "")),
                "away_red_cards": _safe_int(row.get("AR", "")),
            }

            supabase.table("matches").insert(match_data).execute()
            count += 1

    return count


async def ingest_all_matches() -> Dict[str, int]:
    """Ingest all match CSVs from backend/data/matches/."""
    if not os.path.isdir(MATCHES_DIR):
        print(f"Matches directory not found: {MATCHES_DIR}")
        return {"total": 0}

    results = {}
    total = 0

    for filename in sorted(os.listdir(MATCHES_DIR)):
        if not filename.endswith(".csv"):
            continue

        # Parse filename: E0_1011.csv → league_code="E0", season_code="1011"
        parts = filename.replace(".csv", "").split("_")
        if len(parts) != 2:
            print(f"  Skipping {filename} (unexpected name format)")
            continue

        league_code, season_code = parts
        season = SEASON_CODE_TO_YEAR.get(season_code)
        if season is None:
            print(f"  Skipping {filename} (unknown season code {season_code})")
            continue

        filepath = os.path.join(MATCHES_DIR, filename)
        try:
            count = await ingest_match_csv(filepath, league_code, season)
            results[filename] = count
            total += count
            print(f"  [OK] {filename}: {count} matches")
        except Exception as e:
            print(f"  [ERR] {filename}: {e}")
            results[filename] = 0

    results["total"] = total
    return results


async def compute_standings(season: int, league_name: str) -> int:
    """Compute league standings from match results for a given season."""
    matches = (
        supabase.table("matches")
        .select("home_club_id, away_club_id, home_score, away_score")
        .eq("season", season)
        .eq("league_name", league_name)
        .eq("status", "finished")
        .execute()
    )

    # Build standings table
    table: Dict[int, dict] = {}
    for m in matches.data:
        hs, aws = m.get("home_score"), m.get("away_score")
        if hs is None or aws is None:
            continue
        for club_id, is_home in [(m["home_club_id"], True), (m["away_club_id"], False)]:
            if club_id not in table:
                table[club_id] = {"played": 0, "won": 0, "drawn": 0, "lost": 0, "points": 0}
            t = table[club_id]
            t["played"] += 1
            gf = hs if is_home else aws
            ga = aws if is_home else hs
            if gf > ga:
                t["won"] += 1
                t["points"] += 3
            elif gf == ga:
                t["drawn"] += 1
                t["points"] += 1
            else:
                t["lost"] += 1

    # Sort by points, then goal difference (we don't have GD stored yet, just points)
    sorted_clubs = sorted(table.items(), key=lambda x: x[1]["points"], reverse=True)

    count = 0
    for position, (club_id, stats) in enumerate(sorted_clubs, 1):
        supabase.table("standings_history").upsert({
            "club_id": club_id,
            "league": league_name,
            "season": season,
            "position": position,
            "points": stats["points"],
            "played": stats["played"],
            "won": stats["won"],
            "drawn": stats["drawn"],
            "lost": stats["lost"],
        }, on_conflict="club_id,league,season").execute()
        count += 1

    return count


async def compute_all_standings() -> int:
    """Compute standings for every league+season combination in the database."""
    # Get distinct league_name + season pairs (paginate to avoid 1000-row default limit)
    pairs = set()
    offset = 0
    page_size = 1000
    while True:
        batch = (
            supabase.table("matches")
            .select("league_name, season")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        if not batch.data:
            break
        for m in batch.data:
            ln = m.get("league_name")
            s = m.get("season")
            if ln and s:
                pairs.add((ln, s))
        if len(batch.data) < page_size:
            break
        offset += page_size

    total = 0
    for league_name, season in sorted(pairs):
        count = await compute_standings(season, league_name)
        print(f"  Standings: {league_name} {season}-{season+1}: {count} clubs")
        total += count
    return total


def _resolve_club_id(fbref_name: str) -> Optional[int]:
    """Resolve FBref team name to our clubs.id using the mapping, then cache."""
    db_name = FBREF_TEAM_MAP.get(fbref_name, fbref_name)
    cache_key = db_name.lower().strip()
    if cache_key in _club_cache:
        return _club_cache[cache_key]

    result = supabase.table("clubs").select("id").eq("name", db_name).execute()
    if result.data:
        _club_cache[cache_key] = result.data[0]["id"]
        return result.data[0]["id"]

    result = supabase.table("clubs").select("id").ilike("name", db_name).execute()
    if result.data:
        _club_cache[cache_key] = result.data[0]["id"]
        return result.data[0]["id"]

    return None


async def ingest_player_csv(filepath: str, league: str, season: int) -> int:
    """Ingest a single FBref player stats CSV."""
    count = 0
    unmatched_teams = set()
    with open(filepath, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            player_name = row.get("Player", "").strip()
            if not player_name or player_name == "Player":
                continue

            team_name = row.get("Squad", "").strip()
            db_team_name = FBREF_TEAM_MAP.get(team_name, team_name)

            player_data = {
                "player_name": player_name,
                "nation": row.get("Nation", "").strip() or None,
                "position": row.get("Pos", "").strip() or None,
                "age": _safe_int(row.get("Age", "")),
                "team_name": db_team_name,
                "league": league,
                "season": season,
                "matches_played": _safe_int(row.get("MP", "")),
                "starts": _safe_int(row.get("Starts", "")),
                "minutes": _safe_int(row.get("Min", "").replace(",", "")),
                "goals": _safe_int(row.get("Gls", "")),
                "assists": _safe_int(row.get("Ast", "")),
                "yellow_cards": _safe_int(row.get("CrdY", "")),
                "red_cards": _safe_int(row.get("CrdR", "")),
            }

            if team_name:
                club_id = _resolve_club_id(team_name)
                if club_id:
                    player_data["club_id"] = club_id
                elif team_name not in unmatched_teams:
                    unmatched_teams.add(team_name)

            supabase.table("player_stats").upsert(
                player_data, on_conflict="player_name,team_name,season"
            ).execute()
            count += 1

    if unmatched_teams:
        print(f"    Unmatched teams: {', '.join(sorted(unmatched_teams))}")

    return count


async def ingest_all_players() -> Dict[str, int]:
    """Ingest all player CSVs from backend/data/players/."""
    if not os.path.isdir(PLAYERS_DIR):
        print(f"Players directory not found: {PLAYERS_DIR}")
        return {"total": 0}

    results = {}
    total = 0

    for filename in sorted(os.listdir(PLAYERS_DIR)):
        if not filename.endswith(".csv"):
            continue

        # Expected format: epl_2017-18.csv or laliga_2023-24.csv
        filepath = os.path.join(PLAYERS_DIR, filename)
        parts = filename.replace(".csv", "").split("_")
        if len(parts) != 2:
            print(f"  Skipping {filename} (unexpected format)")
            continue

        league_key, season_range = parts
        league_lookup = {
            "epl": "Premier League",
            "laliga": "La Liga",
            "bundesliga": "Bundesliga",
            "seriea": "Serie A",
            "ligue1": "Ligue 1",
        }
        league = league_lookup.get(league_key, league_key)

        try:
            season_year = int(season_range.split("-")[0])
        except ValueError:
            print(f"  Skipping {filename} (can't parse season)")
            continue

        try:
            count = await ingest_player_csv(filepath, league, season_year)
            results[filename] = count
            total += count
            print(f"  [OK] {filename}: {count} players")
        except Exception as e:
            print(f"  [ERR] {filename}: {e}")
            results[filename] = 0

    results["total"] = total
    return results
