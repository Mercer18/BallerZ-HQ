"""
Download match CSVs from football-data.co.uk
Covers 5 top European leagues, seasons 2010-11 through 2024-25.

Usage:
    cd backend
    python scripts/download_matches.py
"""

import os
import time
import httpx

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "matches")

LEAGUES = {
    "E0": "Premier League",
    "SP1": "La Liga",
    "D1": "Bundesliga",
    "I1": "Serie A",
    "F1": "Ligue 1",
}

# Season codes: "1011" = 2010-11, ..., "2425" = 2024-25
SEASONS = [
    ("1011", "2010-11"),
    ("1112", "2011-12"),
    ("1213", "2012-13"),
    ("1314", "2013-14"),
    ("1415", "2014-15"),
    ("1516", "2015-16"),
    ("1617", "2016-17"),
    ("1718", "2017-18"),
    ("1819", "2018-19"),
    ("1920", "2019-20"),
    ("2021", "2020-21"),
    ("2122", "2021-22"),
    ("2223", "2022-23"),
    ("2324", "2023-24"),
    ("2425", "2024-25"),
]

BASE_URL = "https://www.football-data.co.uk/mmz4281"


def download_all():
    os.makedirs(DATA_DIR, exist_ok=True)

    total = len(LEAGUES) * len(SEASONS)
    downloaded = 0
    skipped = 0
    failed = 0

    print(f"Downloading {total} CSVs to {os.path.abspath(DATA_DIR)}\n")

    with httpx.Client(timeout=30, follow_redirects=True) as client:
        for league_code, league_name in LEAGUES.items():
            for season_code, season_label in SEASONS:
                filename = f"{league_code}_{season_code}.csv"
                filepath = os.path.join(DATA_DIR, filename)

                # Skip if already downloaded
                if os.path.exists(filepath) and os.path.getsize(filepath) > 100:
                    skipped += 1
                    print(f"  [SKIP] {filename} (already exists)")
                    continue

                url = f"{BASE_URL}/{season_code}/{league_code}.csv"
                try:
                    resp = client.get(url)
                    if resp.status_code == 200 and len(resp.content) > 100:
                        with open(filepath, "wb") as f:
                            f.write(resp.content)
                        downloaded += 1
                        print(f"  [OK]   {filename}  ({league_name} {season_label}, {len(resp.content):,} bytes)")
                    else:
                        failed += 1
                        print(f"  [FAIL] {filename}  (HTTP {resp.status_code}, {len(resp.content)} bytes)")
                except Exception as e:
                    failed += 1
                    print(f"  [ERR]  {filename}  ({e})")

                # Be polite to the server
                time.sleep(0.5)

    print(f"\nDone! Downloaded: {downloaded}, Skipped: {skipped}, Failed: {failed}")


if __name__ == "__main__":
    download_all()
