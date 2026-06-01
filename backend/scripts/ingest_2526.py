"""
One-off: ingest ONLY the 2025-26 season (matches) and recompute its standings.
Leaves all 14 existing seasons untouched. Safe to re-run (idempotent per season).

Run: python backend/scripts/ingest_2526.py
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.data_ingest import (
    ingest_match_csv,
    compute_standings,
    MATCHES_DIR,
    LEAGUE_MAP,
)

SEASON = 2025
LEAGUE_CODES = ["E0", "SP1", "D1", "I1", "F1"]


async def main():
    print(f"Ingesting 2025-26 matches (season={SEASON})...")
    for code in LEAGUE_CODES:
        filename = f"{code}_2526.csv"
        filepath = os.path.join(MATCHES_DIR, filename)
        if not os.path.exists(filepath):
            print(f"  [SKIP] {filename} not found")
            continue
        count = await ingest_match_csv(filepath, code, SEASON)
        print(f"  [OK] {filename}: {count} matches")

    print("\nRecomputing 2025-26 standings...")
    for code in LEAGUE_CODES:
        league_name = LEAGUE_MAP[code]["name"]
        n = await compute_standings(SEASON, league_name)
        print(f"  [OK] {league_name}: {n} clubs")

    print("\nDone. 2025-26 season added.")


if __name__ == "__main__":
    asyncio.run(main())
