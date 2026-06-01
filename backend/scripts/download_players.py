"""
Download player stats from FBref via soccerdata and save as CSVs.

Creates backend/data/players/ with files like:
  epl_2017-18.csv, laliga_2023-24.csv, etc.

These CSVs are then ingested by the existing ingest_all_players() pipeline.

Usage:
  python backend/scripts/download_players.py              # all leagues, all seasons
  python backend/scripts/download_players.py --league epl  # one league only
  python backend/scripts/download_players.py --season 2324  # one season only
"""

import argparse
import os
import sys
import time

import pandas as pd
import soccerdata as sd

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PLAYERS_DIR = os.path.join(SCRIPT_DIR, "..", "data", "players")

LEAGUES = {
    "epl":        "ENG-Premier League",
    "laliga":     "ESP-La Liga",
    "bundesliga": "GER-Bundesliga",
    "seriea":     "ITA-Serie A",
    "ligue1":     "FRA-Ligue 1",
}

SEASONS = [
    "1718", "1819", "1920", "2021", "2122", "2223", "2324", "2425", "2526",
]

SEASON_TO_LABEL = {
    "1718": "2017-18", "1819": "2018-19", "1920": "2019-20",
    "2021": "2020-21", "2122": "2021-22", "2223": "2022-23",
    "2324": "2023-24", "2425": "2024-25", "2526": "2025-26",
}

FBREF_COL_MAP = {
    ("nation", ""):             "Nation",
    ("pos", ""):                "Pos",
    ("age", ""):                "Age",
    ("Playing Time", "MP"):     "MP",
    ("Playing Time", "Starts"): "Starts",
    ("Playing Time", "Min"):    "Min",
    ("Performance", "Gls"):     "Gls",
    ("Performance", "Ast"):     "Ast",
    ("Performance", "CrdY"):    "CrdY",
    ("Performance", "CrdR"):    "CrdR",
    ("Performance", "G+A"):     "G+A",
    ("Performance", "G-PK"):    "G-PK",
    ("Per 90 Minutes", "Gls"):  "Gls_per90",
    ("Per 90 Minutes", "Ast"):  "Ast_per90",
}


def flatten_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Flatten FBref multi-level columns into the format ingest_player_csv expects."""
    flat = pd.DataFrame()

    idx = df.index.to_frame(index=False)
    if "player" in idx.columns:
        flat["Player"] = idx["player"].values
    if "team" in idx.columns:
        flat["Squad"] = idx["team"].values

    for multi_col, flat_name in FBREF_COL_MAP.items():
        if multi_col in df.columns:
            flat[flat_name] = df[multi_col].values

    return flat


def download_league_season(league_key: str, season_code: str) -> bool:
    """Download one league+season from FBref and save as CSV. Returns True on success."""
    fbref_league = LEAGUES[league_key]
    label = SEASON_TO_LABEL[season_code]
    filename = f"{league_key}_{label}.csv"
    filepath = os.path.join(PLAYERS_DIR, filename)

    if os.path.exists(filepath):
        print(f"  SKIP {filename} (already exists)")
        return True

    print(f"  Fetching {fbref_league} {season_code} ...", end=" ", flush=True)

    try:
        fbref = sd.FBref(leagues=fbref_league, seasons=season_code)
        stats = fbref.read_player_season_stats(stat_type="standard")
    except Exception as e:
        print(f"ERROR: {e}")
        return False

    flat = flatten_columns(stats)
    flat.to_csv(filepath, index=False, encoding="utf-8-sig")
    print(f"OK -- {len(flat)} players -> {filename}")
    return True


def main():
    parser = argparse.ArgumentParser(description="Download FBref player stats as CSVs")
    parser.add_argument("--league", choices=list(LEAGUES.keys()), help="Single league to download")
    parser.add_argument("--season", choices=SEASONS, help="Single season code (e.g. 2324)")
    args = parser.parse_args()

    os.makedirs(PLAYERS_DIR, exist_ok=True)

    leagues = [args.league] if args.league else list(LEAGUES.keys())
    seasons = [args.season] if args.season else SEASONS

    total_files = len(leagues) * len(seasons)
    print(f"Downloading {total_files} player files to {PLAYERS_DIR}")
    print(f"Leagues: {', '.join(leagues)}")
    print(f"Seasons: {', '.join(SEASON_TO_LABEL[s] for s in seasons)}")
    print()

    success = 0
    failed = []

    for league_key in leagues:
        print(f"[{LEAGUES[league_key]}]")
        for season_code in seasons:
            ok = download_league_season(league_key, season_code)
            if ok:
                success += 1
            else:
                failed.append(f"{league_key}_{SEASON_TO_LABEL[season_code]}")
            time.sleep(4)
        print()

    print(f"Done: {success}/{total_files} files downloaded.")
    if failed:
        print(f"Failed: {', '.join(failed)}")
        print("Re-run the script to retry failed downloads (existing files are skipped).")
        sys.exit(1)


if __name__ == "__main__":
    main()
