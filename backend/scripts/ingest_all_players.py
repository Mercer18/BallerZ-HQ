"""
Ingest all player CSVs from backend/data/players/ into Supabase.
Run: python backend/scripts/ingest_all_players.py
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.data_ingest import ingest_all_players


async def main():
    results = await ingest_all_players()
    total = results.pop("total", 0)
    print(f"\nTotal: {total} players ingested across {len(results)} files.")


if __name__ == "__main__":
    asyncio.run(main())
