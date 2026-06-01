"""
International / World Cup 2026 API — national teams, confederation filter,
groups, fixtures, and Match IQ predictions (Elo + Poisson).
"""

import math
from collections import defaultdict
from typing import Optional

from fastapi import APIRouter, Query, HTTPException
from app.database import supabase_anon as supabase

router = APIRouter()

CONFEDERATIONS = [
    {"code": "UEFA", "name": "Europe"},
    {"code": "CONMEBOL", "name": "South America"},
    {"code": "CONCACAF", "name": "North & Central America"},
    {"code": "CAF", "name": "Africa"},
    {"code": "AFC", "name": "Asia"},
    {"code": "OFC", "name": "Oceania"},
]


# ── Match IQ prediction engine ──────────────────────────────────────
def _poisson_pmf(k: int, lam: float) -> float:
    return math.exp(-lam) * lam ** k / math.factorial(k)


def match_iq(home_elo: float, away_elo: float, neutral: bool = True) -> dict:
    """Predict a fixture from Elo ratings via a Poisson scoreline model."""
    ha = 0.0 if neutral else 100.0
    dr = (home_elo - away_elo) + ha
    mu_diff = dr / 100.0 * 0.40          # expected goal supremacy
    total = 2.60                          # avg total goals (international)
    home_l = max(0.15, (total + mu_diff) / 2.0)
    away_l = max(0.15, (total - mu_diff) / 2.0)

    maxg = 8
    p_home = p_draw = p_away = 0.0
    best = (0, 0, -1.0)
    for i in range(maxg + 1):
        for j in range(maxg + 1):
            p = _poisson_pmf(i, home_l) * _poisson_pmf(j, away_l)
            if i > j:
                p_home += p
            elif i == j:
                p_draw += p
            else:
                p_away += p
            if p > best[2]:
                best = (i, j, p)
    s = p_home + p_draw + p_away or 1.0
    return {
        "home_win": round(p_home / s * 100, 1),
        "draw": round(p_draw / s * 100, 1),
        "away_win": round(p_away / s * 100, 1),
        "likely_score": f"{best[0]}-{best[1]}",
        "home_xg": round(home_l, 2),
        "away_xg": round(away_l, 2),
        "confidence": round(max(p_home, p_draw, p_away) / s * 100, 1),
    }


def _teams_by_id() -> dict:
    rows = supabase.table("national_teams").select(
        "id, name, code, confederation, flag_emoji, elo_rating, wc_group"
    ).execute().data or []
    return {t["id"]: t for t in rows}


# ── Endpoints ───────────────────────────────────────────────────────
@router.get("/confederations")
async def confederations():
    """The 6 FIFA confederations with WC 2026 team counts (the int'l 'league filter')."""
    teams = supabase.table("national_teams").select("confederation").execute().data or []
    counts = defaultdict(int)
    for t in teams:
        counts[t["confederation"]] += 1
    return [{**c, "teams": counts.get(c["code"], 0)} for c in CONFEDERATIONS]


@router.get("/teams")
async def teams(confederation: Optional[str] = None, group: Optional[str] = None):
    """National teams, filterable by confederation or group. Sorted by Match IQ Elo."""
    q = supabase.table("national_teams").select(
        "id, name, code, confederation, flag_emoji, elo_rating, wc_group"
    )
    if confederation:
        q = q.eq("confederation", confederation)
    if group:
        q = q.eq("wc_group", group)
    rows = q.order("elo_rating", desc=True).execute().data or []
    return rows


@router.get("/groups")
async def groups():
    """All 12 WC 2026 groups with teams and live standings (computed from results)."""
    teams = _teams_by_id()
    matches = supabase.table("international_matches").select("*").eq("edition_year", 2026).execute().data or []

    # init standings per team
    table = {
        tid: {"team_id": tid, "name": t["name"], "flag": t["flag_emoji"], "group": t["wc_group"],
              "elo": t["elo_rating"], "played": 0, "won": 0, "drawn": 0, "lost": 0,
              "gf": 0, "ga": 0, "gd": 0, "points": 0}
        for tid, t in teams.items() if t["wc_group"]
    }
    for m in matches:
        if m["status"] != "finished" or m["home_score"] is None:
            continue
        h, a = m["home_team_id"], m["away_team_id"]
        hs, as_ = m["home_score"], m["away_score"]
        for tid, gf, ga in ((h, hs, as_), (a, as_, hs)):
            r = table[tid]
            r["played"] += 1; r["gf"] += gf; r["ga"] += ga; r["gd"] += gf - ga
            if gf > ga:
                r["won"] += 1; r["points"] += 3
            elif gf == ga:
                r["drawn"] += 1; r["points"] += 1
            else:
                r["lost"] += 1

    grouped = defaultdict(list)
    for r in table.values():
        grouped[r["group"]].append(r)
    out = []
    for g in sorted(grouped):
        standings = sorted(grouped[g], key=lambda r: (-r["points"], -r["gd"], -r["gf"], -r["elo"]))
        out.append({"group": g, "standings": standings})
    return out


@router.get("/fixtures")
async def fixtures(group: Optional[str] = None, team_id: Optional[int] = None,
                   include_prediction: bool = True):
    """WC 2026 fixtures with team info and Match IQ predictions."""
    teams = _teams_by_id()
    q = supabase.table("international_matches").select("*").eq("edition_year", 2026)
    if group:
        q = q.eq("group_name", group)
    rows = q.order("match_date").order("id").execute().data or []

    out = []
    for m in rows:
        h, a = teams.get(m["home_team_id"]), teams.get(m["away_team_id"])
        if not h or not a:
            continue
        if team_id and team_id not in (m["home_team_id"], m["away_team_id"]):
            continue
        item = {
            "id": m["id"], "date": m["match_date"], "group": m["group_name"], "stage": m["stage"],
            "venue_city": m["venue_city"], "host_country": m["host_country"], "neutral": m["neutral"],
            "status": m["status"], "home_score": m["home_score"], "away_score": m["away_score"],
            "home": {"id": h["id"], "name": h["name"], "flag": h["flag_emoji"], "confederation": h["confederation"]},
            "away": {"id": a["id"], "name": a["name"], "flag": a["flag_emoji"], "confederation": a["confederation"]},
        }
        if include_prediction:
            item["match_iq"] = match_iq(h["elo_rating"], a["elo_rating"], neutral=m["neutral"])
        out.append(item)
    return out


@router.get("/predict")
async def predict(home_id: int = Query(...), away_id: int = Query(...), neutral: bool = True):
    """Match IQ prediction for any two national teams."""
    teams = _teams_by_id()
    h, a = teams.get(home_id), teams.get(away_id)
    if not h or not a:
        raise HTTPException(status_code=404, detail="Team not found")
    return {
        "home": {"id": h["id"], "name": h["name"], "flag": h["flag_emoji"], "elo": h["elo_rating"]},
        "away": {"id": a["id"], "name": a["name"], "flag": a["flag_emoji"], "elo": a["elo_rating"]},
        "match_iq": match_iq(h["elo_rating"], a["elo_rating"], neutral=neutral),
    }
