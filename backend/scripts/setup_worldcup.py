"""
World Cup 2026 setup — one-time.

1. Seeds the 48 national teams (confederation + group + flag).
2. Computes Match IQ Elo ratings from the full international results history
   (backend/data/international/results.csv, 1872 -> 2026, martj42 dataset).
3. Loads the 72 WC 2026 group-stage fixtures (real dates/venues from the dataset).

Idempotent: upserts teams by name, replaces 2026 fixtures.

Run: python backend/scripts/setup_worldcup.py
"""

import csv
import os
import sys
from collections import defaultdict
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app.database import supabase

DATA = os.path.join(os.path.dirname(__file__), "..", "data", "international", "results.csv")

# ── 48 WC 2026 teams: name (dataset spelling) -> (confederation, group, flag) ──
TEAMS = {
    # Group A
    "Mexico": ("CONCACAF", "A", "🇲🇽"), "South Africa": ("CAF", "A", "🇿🇦"),
    "South Korea": ("AFC", "A", "🇰🇷"), "Czech Republic": ("UEFA", "A", "🇨🇿"),
    # Group B
    "Canada": ("CONCACAF", "B", "🇨🇦"), "Bosnia and Herzegovina": ("UEFA", "B", "🇧🇦"),
    "Qatar": ("AFC", "B", "🇶🇦"), "Switzerland": ("UEFA", "B", "🇨🇭"),
    # Group C
    "Brazil": ("CONMEBOL", "C", "🇧🇷"), "Morocco": ("CAF", "C", "🇲🇦"),
    "Haiti": ("CONCACAF", "C", "🇭🇹"), "Scotland": ("UEFA", "C", "🏴󠁧󠁢󠁳󠁣󠁴󠁿"),
    # Group D
    "United States": ("CONCACAF", "D", "🇺🇸"), "Paraguay": ("CONMEBOL", "D", "🇵🇾"),
    "Australia": ("AFC", "D", "🇦🇺"), "Turkey": ("UEFA", "D", "🇹🇷"),
    # Group E
    "Germany": ("UEFA", "E", "🇩🇪"), "Curaçao": ("CONCACAF", "E", "🇨🇼"),
    "Ivory Coast": ("CAF", "E", "🇨🇮"), "Ecuador": ("CONMEBOL", "E", "🇪🇨"),
    # Group F
    "Netherlands": ("UEFA", "F", "🇳🇱"), "Japan": ("AFC", "F", "🇯🇵"),
    "Sweden": ("UEFA", "F", "🇸🇪"), "Tunisia": ("CAF", "F", "🇹🇳"),
    # Group G
    "Belgium": ("UEFA", "G", "🇧🇪"), "Egypt": ("CAF", "G", "🇪🇬"),
    "Iran": ("AFC", "G", "🇮🇷"), "New Zealand": ("OFC", "G", "🇳🇿"),
    # Group H
    "Spain": ("UEFA", "H", "🇪🇸"), "Cape Verde": ("CAF", "H", "🇨🇻"),
    "Saudi Arabia": ("AFC", "H", "🇸🇦"), "Uruguay": ("CONMEBOL", "H", "🇺🇾"),
    # Group I
    "France": ("UEFA", "I", "🇫🇷"), "Senegal": ("CAF", "I", "🇸🇳"),
    "Iraq": ("AFC", "I", "🇮🇶"), "Norway": ("UEFA", "I", "🇳🇴"),
    # Group J
    "Argentina": ("CONMEBOL", "J", "🇦🇷"), "Algeria": ("CAF", "J", "🇩🇿"),
    "Austria": ("UEFA", "J", "🇦🇹"), "Jordan": ("AFC", "J", "🇯🇴"),
    # Group K
    "Portugal": ("UEFA", "K", "🇵🇹"), "DR Congo": ("CAF", "K", "🇨🇩"),
    "Uzbekistan": ("AFC", "K", "🇺🇿"), "Colombia": ("CONMEBOL", "K", "🇨🇴"),
    # Group L
    "England": ("UEFA", "L", "🏴󠁧󠁢󠁥󠁮󠁧󠁿"), "Croatia": ("UEFA", "L", "🇭🇷"),
    "Ghana": ("CAF", "L", "🇬🇭"), "Panama": ("CONCACAF", "L", "🇵🇦"),
}


def k_factor(tournament: str) -> float:
    """Match importance weight (World Football Elo style)."""
    t = tournament.lower()
    if "world cup" in t and "qualif" not in t:
        return 60.0
    if any(x in t for x in ("uefa euro", "copa am", "african cup", "afc asian", "gold cup", "confederations")) and "qualif" not in t:
        return 50.0
    if "qualif" in t:
        return 40.0
    if "friendly" in t:
        return 20.0
    return 30.0


def goal_mult(gd: int) -> float:
    gd = abs(gd)
    if gd <= 1:
        return 1.0
    if gd == 2:
        return 1.5
    return (11 + gd) / 8.0


def compute_elo():
    """Stream the full history chronologically and compute Elo for every team."""
    elo = defaultdict(lambda: 1500.0)
    played = defaultdict(int)
    rows = []
    with open(DATA, "r", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["home_score"] in ("", "NA") or r["away_score"] in ("", "NA"):
                continue  # skip unplayed (incl. the 2026 fixtures)
            rows.append(r)

    rows.sort(key=lambda r: r["date"])
    for r in rows:
        h, a = r["home_team"], r["away_team"]
        try:
            hs, as_ = int(r["home_score"]), int(r["away_score"])
        except ValueError:
            continue
        neutral = r["neutral"].strip().upper() == "TRUE"
        ha = 0.0 if neutral else 100.0
        dr = elo[h] - elo[a] + ha
        we = 1.0 / (1.0 + 10 ** (-dr / 400.0))
        w = 1.0 if hs > as_ else (0.5 if hs == as_ else 0.0)
        k = k_factor(r["tournament"]) * goal_mult(hs - as_)
        delta = k * (w - we)
        elo[h] += delta
        elo[a] -= delta
        played[h] += 1
        played[a] += 1
    return elo, played


def main():
    print("Computing Match IQ Elo ratings from international history...")
    elo, played = compute_elo()
    print(f"  Rated {len(elo)} national teams from played matches.")

    # 1) Upsert the 48 teams with their Elo
    print("Seeding 48 World Cup 2026 teams...")
    name_to_id = {}
    for name, (conf, group, flag) in TEAMS.items():
        rating = round(elo.get(name, 1500.0), 1)
        res = supabase.table("national_teams").upsert({
            "name": name, "confederation": conf, "wc_group": group,
            "flag_emoji": flag, "elo_rating": rating,
        }, on_conflict="name").execute()
        name_to_id[name] = res.data[0]["id"]
    print(f"  Seeded {len(name_to_id)} teams.")

    # 2) Replace 2026 WC fixtures
    print("Loading WC 2026 fixtures...")
    supabase.table("international_matches").delete().eq("edition_year", 2026).execute()
    count = 0
    with open(DATA, "r", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["tournament"] != "FIFA World Cup" or not r["date"].startswith("2026"):
                continue
            h, a = r["home_team"], r["away_team"]
            if h not in name_to_id or a not in name_to_id:
                print(f"  [WARN] unknown team in fixture: {h} vs {a}")
                continue
            played_score = r["home_score"] not in ("", "NA")
            supabase.table("international_matches").insert({
                "competition": "FIFA World Cup", "edition_year": 2026,
                "stage": "group", "group_name": TEAMS[h][1],
                "match_date": r["date"],
                "home_team_id": name_to_id[h], "away_team_id": name_to_id[a],
                "home_score": int(r["home_score"]) if played_score else None,
                "away_score": int(r["away_score"]) if played_score else None,
                "venue_city": r["city"], "host_country": r["country"],
                "neutral": r["neutral"].strip().upper() == "TRUE",
                "status": "finished" if played_score else "scheduled",
            }).execute()
            count += 1
    print(f"  Loaded {count} fixtures.")

    # Quick sanity: top 5 by Elo among WC teams
    top = sorted(((n, elo.get(n, 1500)) for n in TEAMS), key=lambda x: -x[1])[:5]
    print("\nTop 5 WC 2026 teams by Match IQ Elo:")
    for n, r in top:
        print(f"  {n}: {r:.0f}")
    print("\nDone.")


if __name__ == "__main__":
    main()
