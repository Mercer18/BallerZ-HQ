"""
Data ingestion services - fetch from external football APIs
"""

import httpx
from app.config import settings
from app.database import supabase

API_FOOTBALL_BASE = "https://v3.football.api-sports.io"
CLUBELO_BASE = "http://api.clubeolo.com"  # Free Elo ratings

async def fetch_fixtures(league_id: int, season: int) -> int:
    """
    Fetch upcoming fixtures from API-Football
    """
    headers = {
        'x-apisports-host': API_FOOTBALL_BASE.replace('https://', ''),
        'x-apisports-key': settings.FOOTBALL_API_KEY
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{API_FOOTBALL_BASE}/fixtures",
            headers=headers,
            params={
                'league': league_id,
                'season': season
            }
        )
        response.raise_for_status()
        data = response.json()

    fixtures = data.get('response', [])
    count = 0

    for fixture in fixtures:
        match_data = {
            'api_id': fixture['fixture']['id'],
            'home_club_id': fixture['teams']['home']['id'],
            'away_club_id': fixture['teams']['away']['id'],
            'date': fixture['fixture']['timestamp'],
            'status': 'scheduled' if fixture['fixture']['status']['short'] == 'NS' else 'finished',
            'home_score': fixture['goals']['home'],
            'away_score': fixture['goals']['away'],
            'league_id': league_id,
            'season': season
        }

        # Upsert to avoid duplicates
        supabase.table('matches').upsert(match_data).execute()
        count += 1

    return count

async def fetch_results(league_id: int, season: int) -> int:
    """
    Fetch completed match results
    """
    headers = {
        'x-apisports-host': API_FOOTBALL_BASE.replace('https://', ''),
        'x-apisports-key': settings.FOOTBALL_API_KEY
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{API_FOOTBALL_BASE}/fixtures",
            headers=headers,
            params={
                'league': league_id,
                'season': season,
                'status': 'FT'
            }
        )
        response.raise_for_status()
        data = response.json()

    results = data.get('response', [])
    count = 0

    for result in results:
        match_data = {
            'api_id': result['fixture']['id'],
            'home_club_id': result['teams']['home']['id'],
            'away_club_id': result['teams']['away']['id'],
            'date': result['fixture']['timestamp'],
            'status': 'finished',
            'home_score': result['goals']['home'],
            'away_score': result['goals']['away'],
            'league_id': league_id,
            'season': season
        }

        supabase.table('matches').upsert(match_data).execute()
        count += 1

    return count

async def fetch_standings(league_id: int, season: int) -> int:
    """
    Fetch league standings and update clubs table
    """
    headers = {
        'x-apisports-host': API_FOOTBALL_BASE.replace('https://', ''),
        'x-apisports-key': settings.FOOTBALL_API_KEY
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{API_FOOTBALL_BASE}/standings",
            headers=headers,
            params={
                'league': league_id,
                'season': season
            }
        )
        response.raise_for_status()
        data = response.json()

    standings = data.get('response', [])
    count = 0

    for standing in standings:
        team = standing['team']
        club_data = {
            'api_id': team['id'],
            'name': team['name'],
            'logo': team['logo'],
            'league': standing['league']['name'],
            'country': team['country'] if 'country' in team else 'Unknown',
            'league_position': standing['rank'],
            'points': standing['points'],
            'played': standing['all']['played'],
            'won': standing['all']['win'],
            'drawn': standing['all']['draw'],
            'lost': standing['all']['lose'],
        }

        supabase.table('clubs').upsert(club_data).execute()
        count += 1

    return count

async def update_club_elo() -> int:
    """
    Fetch ClubElo ratings for squad strength
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{CLUBELO_BASE}/elo")
            response.raise_for_status()
            data = response.json()
    except Exception as e:
        print(f"ClubElo fetch failed: {e}")
        return 0

    count = 0
    for club in data:
        # Find matching club by name
        clubs = supabase.table('clubs').select('id').ilike('name', club['name']).execute()

        if clubs.data:
            supabase.table('clubs').update({
                'elo_rating': club['elo']
            }).eq('id', clubs.data[0]['id']).execute()
            count += 1

    return count
