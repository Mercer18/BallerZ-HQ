"""
Smoke test: verify soccerdata can pull player stats from FBref.
Fetches one league (Premier League), one season (2023-24), standard stats only.
Run: python backend/scripts/smoke_test_fbref.py
"""

import soccerdata as sd

LEAGUE = "ENG-Premier League"
SEASON = "2324"

print(f"Fetching {LEAGUE} {SEASON} player stats from FBref...")
print("(This may take 30-60s due to FBref rate limiting)\n")

fbref = sd.FBref(leagues=LEAGUE, seasons=SEASON)

try:
    stats = fbref.read_player_season_stats(stat_type="standard")
    print(f"Success! Got {len(stats)} player rows.")
    print(f"\nColumns ({len(stats.columns)}):")
    print(list(stats.columns))
    print(f"\nFirst 5 rows (name, team, goals, assists):")
    preview = stats.reset_index()
    cols_to_show = [c for c in ["player", "team", "goals", "assists", "mp"] if c in preview.columns]
    if cols_to_show:
        print(preview[cols_to_show].head().to_string(index=False))
    else:
        print(preview.head().to_string())
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
    print("\nIf FBref blocked the request, we may need to:")
    print("  1. Wait and retry (they rate-limit aggressively)")
    print("  2. Fall back to manual CSV download from FBref")
