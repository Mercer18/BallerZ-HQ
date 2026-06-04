"""
AI Chat endpoint — RAG over the Supabase football corpus.

Builds a rich context from the user's tracked club:
- current season standings (position, points, goal difference, record)
- last 5 league matches (with score, opponent, home/away)
- previous season comparison (where applicable)
- recent stats aggregate (form, goals scored/conceded, cards)

Then asks Groq to answer the user's question grounded in that context.
"""

import re
import unicodedata
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from app.database import supabase
from app.ai.chatbot import generate_response
from app.services.rate_limit import check_rate_limit

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    mode: str = "analyst"  # 'analyst' or 'hype'
    user_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    sources: list = []


class SeasonStoryRequest(BaseModel):
    user_id: str


class SeasonStoryResponse(BaseModel):
    story: str
    headline: str
    powered_by_ai: bool


@router.post("/season-story", response_model=SeasonStoryResponse)
async def season_story(req: SeasonStoryRequest):
    """A 1-2 sentence narrative summary of the user's club's current season."""
    context = build_user_context(req.user_id)
    if not context.get("standing") and not context.get("this_season"):
        return SeasonStoryResponse(
            story="Pick a club in onboarding to see your season story here.",
            headline="No club tracked",
            powered_by_ai=False,
        )

    from app.ai.chatbot import generate_season_story
    story, headline, used_ai = generate_season_story(context)
    return SeasonStoryResponse(story=story, headline=headline, powered_by_ai=used_ai)


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with the AI analyst. Grounded in real data from the Supabase corpus."""

    # ── input validation ─────────────────────────────────────────────
    if not request.message or len(request.message.strip()) == 0:
        raise HTTPException(400, "Empty message")
    if len(request.message) > 500:
        raise HTTPException(400, "Message too long (max 500 chars)")

    # ── rate limit ───────────────────────────────────────────────────
    if request.user_id:
        allowed, reset_in = check_rate_limit(request.user_id, max_per_hour=30)
        if not allowed:
            raise HTTPException(429, f"Too many messages. Try again in {reset_in}s")

    # ── build context ────────────────────────────────────────────────
    context = build_user_context(request.user_id, request.message) if request.user_id else {}

    # ── ask the model ────────────────────────────────────────────────
    response_text = generate_response(
        message=request.message,
        mode=request.mode,
        context=context,
    )

    return ChatResponse(response=response_text)


def build_user_context(user_id: str, message: str = "") -> Dict[str, Any]:
    """Pull everything we know about the user's club + give the LLM grounded data.
    Falls back to an empty context if the user hasn't completed onboarding."""

    try:
        prefs = (
            supabase.table("user_preferences")
            .select("favorite_club_id, clubs (id, name, league, country)")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
    except Exception:
        return {}

    if not prefs.data or not prefs.data[0].get("clubs"):
        return {}

    club = prefs.data[0]["clubs"]
    club_id = club["id"]
    context: Dict[str, Any] = {"favorite_club": club}

    # ── recent matches (last 5, finished, ordered by match_date desc) ─
    recent = (
        supabase.table("matches")
        .select(
            "id, match_date, season, status, "
            "home_club_id, away_club_id, home_score, away_score, "
            "home_club:home_club_id(name), away_club:away_club_id(name)"
        )
        .or_(f"home_club_id.eq.{club_id},away_club_id.eq.{club_id}")
        .eq("status", "finished")
        .order("match_date", desc=True)
        .limit(5)
        .execute()
    )
    context["recent_matches"] = recent.data or []

    # ── current season inferred from most-recent match ───────────────
    current_season: Optional[int] = None
    if context["recent_matches"]:
        current_season = context["recent_matches"][0].get("season")
    context["current_season"] = current_season

    # ── current season standings row (position, points, GD) ──────────
    if current_season is not None:
        st = (
            supabase.table("standings_history")
            .select("position, points, played, won, drawn, lost")
            .eq("club_id", club_id)
            .eq("season", current_season)
            .limit(1)
            .execute()
        )
        if st.data:
            row = st.data[0]
            context["standing"] = {
                "position": row["position"],
                "points": row["points"],
                "played": row["played"],
                "won": row["won"],
                "drawn": row["drawn"],
                "lost": row["lost"],
            }

    # ── historical standings (all seasons, ordered by season desc) ────
    st_history = (
        supabase.table("standings_history")
        .select("season, position, points, played, won, drawn, lost, league")
        .eq("club_id", club_id)
        .order("season", desc=True)
        .execute()
    )
    context["historical_standings"] = st_history.data or []

    # ── season aggregates this season (goals for/against, cards) ─────
    if current_season is not None:
        agg = _aggregate_season(club_id, current_season)
        if agg:
            context["this_season"] = agg

    # ── previous season for comparison ───────────────────────────────
    if current_season is not None and current_season > 2010:
        prev_agg = _aggregate_season(club_id, current_season - 1)
        if prev_agg:
            context["prev_season"] = prev_agg

    # ── recent form W-D-L from last 5 ────────────────────────────────
    form: List[str] = []
    for m in context["recent_matches"]:
        is_home = m["home_club_id"] == club_id
        gf = m["home_score"] if is_home else m["away_score"]
        ga = m["away_score"] if is_home else m["home_score"]
        if gf is None or ga is None:
            continue
        form.append("W" if gf > ga else "L" if gf < ga else "D")
    context["form"] = form

    # ── player stats (top scorers + assisters this season) ──────────
    if current_season is not None:
        context["top_scorers"] = _top_players(club_id, current_season, "goals")
        context["top_assisters"] = _top_players(club_id, current_season, "assists")

    # ── player stats previous season for comparison ─────────────────
    if current_season is not None and current_season > 2010:
        context["prev_top_scorers"] = _top_players(club_id, current_season - 1, "goals")

    # ── player stats by season (Tier 1) ─────────────────────────────
    context["players_by_season"] = _players_by_season(club_id)

    # ── specific-player detail from user query (Tier 2) ─────────────
    if message:
        context["queried_players"] = _match_player_in_message(club_id, message)

    # ── club analytics (historical, goals, margins, clean sheets, comebacks, player ratios) ──
    context["club_analytics"] = _calculate_club_analytics(club_id)

    return context



def _top_players(club_id: int, season: int, stat: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Fetch top players for a club+season by a given stat (goals, assists, etc.)."""
    try:
        res = (
            supabase.table("player_stats")
            .select("player_name, position, goals, assists, matches_played, minutes, yellow_cards, red_cards")
            .eq("club_id", club_id)
            .eq("season", season)
            .gt(stat, 0)
            .order(stat, desc=True)
            .limit(limit)
            .execute()
        )
        return res.data or []
    except Exception:
        return []


def _aggregate_season(club_id: int, season: int) -> Optional[Dict[str, Any]]:
    """Aggregate one club's season stats into totals."""
    res = (
        supabase.table("matches")
        .select(
            "home_club_id, away_club_id, home_score, away_score, "
            "home_shots, away_shots, home_yellow_cards, away_yellow_cards, "
            "home_red_cards, away_red_cards"
        )
        .or_(f"home_club_id.eq.{club_id},away_club_id.eq.{club_id}")
        .eq("status", "finished")
        .eq("season", season)
        .execute()
    )
    if not res.data:
        return None

    p = w = d = l = gf = ga = sh = yc = rc = 0
    for m in res.data:
        is_home = m["home_club_id"] == club_id
        sf = m["home_score"] if is_home else m["away_score"]
        sa = m["away_score"] if is_home else m["home_score"]
        if sf is None or sa is None:
            continue
        p += 1
        gf += sf
        ga += sa
        if sf > sa:
            w += 1
        elif sf == sa:
            d += 1
        else:
            l += 1
        sh += (m.get("home_shots") if is_home else m.get("away_shots")) or 0
        yc += (m.get("home_yellow_cards") if is_home else m.get("away_yellow_cards")) or 0
        rc += (m.get("home_red_cards") if is_home else m.get("away_red_cards")) or 0

    return {
        "season": season,
        "played": p, "won": w, "drawn": d, "lost": l,
        "goals_for": gf, "goals_against": ga, "goal_diff": gf - ga,
        "points": w * 3 + d,
        "shots": sh, "yellow_cards": yc, "red_cards": rc,
    }


def _normalize_string(s: str) -> str:
    """Normalize string: lowercase, strip accents."""
    s = s.lower().strip()
    nfkd_form = unicodedata.normalize('NFKD', s)
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])


def _players_by_season(club_id: int, per_season: int = 3) -> Dict[int, List[Dict[str, Any]]]:
    """Fetch top players for a club by season (top 3 scorers per season)."""
    try:
        res = (
            supabase.table("player_stats")
            .select("player_name, position, season, goals, assists, matches_played")
            .eq("club_id", club_id)
            .order("season", desc=True)
            .execute()
        )
        if not res.data:
            return {}

        # Group by season
        by_season: Dict[int, List[Dict[str, Any]]] = {}
        for row in res.data:
            s = row["season"]
            if s not in by_season:
                by_season[s] = []
            by_season[s].append(row)

        # For each season, sort by goals desc, then assists desc, and take top per_season
        result: Dict[int, List[Dict[str, Any]]] = {}
        for s, players in by_season.items():
            sorted_players = sorted(
                players,
                key=lambda p: (p.get("goals") or 0, p.get("assists") or 0),
                reverse=True
            )
            result[s] = sorted_players[:per_season]

        return result
    except Exception:
        return {}


def _match_player_in_message(club_id: int, message: str) -> Dict[str, List[Dict[str, Any]]]:
    """
    Search message for any player name associated with the club.
    If matched, fetch their full multi-season stats.
    Returns a dict: {player_name: [stats_rows]} (up to 2 players).
    """
    if not message:
        return {}
    try:
        # Get all players for this club to match against
        res = (
            supabase.table("player_stats")
            .select("player_name")
            .eq("club_id", club_id)
            .execute()
        )
        if not res.data:
            return {}

        # Distinct canonical names
        player_names = sorted(list({r["player_name"] for r in res.data if r.get("player_name")}))

        norm_message = _normalize_string(message)
        message_words = set(re.findall(r'[a-z0-9]+', norm_message))

        matched_names = []
        for p_name in player_names:
            norm_name = _normalize_string(p_name)
            name_parts = [part for part in re.findall(r'[a-z0-9]+', norm_name) if part]
            if not name_parts:
                continue

            last_name = name_parts[-1]

            is_match = False
            if norm_name in norm_message:
                is_match = True
            elif len(last_name) >= 3 and last_name in message_words:
                is_match = True

            if is_match:
                matched_names.append(p_name)
                if len(matched_names) >= 2:
                    break

        # For each matched player, fetch their full stats at the club
        queried_players = {}
        for p_name in matched_names:
            stats = (
                supabase.table("player_stats")
                .select("season, goals, assists, matches_played, minutes, yellow_cards, red_cards, position")
                .eq("club_id", club_id)
                .eq("player_name", p_name)
                .order("season", desc=True)
                .execute()
            )
            if stats.data:
                queried_players[p_name] = sorted(stats.data, key=lambda x: x.get("season") or 0)

        return queried_players
    except Exception as e:
        import logging
        logging.getLogger("ballerzhq.chat").error("Error in _match_player_in_message: %s", e)
        return {}


def _calculate_club_analytics(club_id: int) -> Dict[str, Any]:
    """
    Calculate extensive historical analytics for the club by pulling all matches
    and player stats in single queries and doing the aggregates in Python.
    """
    from collections import defaultdict
    analytics = {}
    try:
        # 1. Fetch all finished matches for this club
        res = (
            supabase.table("matches")
            .select(
                "id, match_date, season, home_club_id, away_club_id, home_score, away_score, "
                "status, half_time_home_score, half_time_away_score, league_name"
            )
            .or_(f"home_club_id.eq.{club_id},away_club_id.eq.{club_id}")
            .eq("status", "finished")
            .execute()
        )
        matches = res.data or []

        # 2. Fetch all clubs for name lookup to avoid extra queries
        clubs_res = supabase.table("clubs").select("id, name").execute()
        club_names = {c["id"]: c["name"] for c in clubs_res.data or []}

        if matches:
            # A. Biggest victories
            max_margin = 0
            biggest_wins = []
            for m in matches:
                is_home = m["home_club_id"] == club_id
                our_score = m["home_score"] if is_home else m["away_score"]
                opp_score = m["away_score"] if is_home else m["home_score"]
                if our_score is None or opp_score is None or our_score <= opp_score:
                    continue
                margin = our_score - opp_score
                if margin > max_margin:
                    max_margin = margin
                    biggest_wins = [m]
                elif margin == max_margin:
                    biggest_wins.append(m)

            formatted_wins = []
            for m in biggest_wins:
                is_home = m["home_club_id"] == club_id
                opp_id = m["away_club_id"] if is_home else m["home_club_id"]
                opp_name = club_names.get(opp_id, "Unknown")
                our_score = m["home_score"] if is_home else m["away_score"]
                opp_score = m["away_score"] if is_home else m["home_score"]
                formatted_wins.append(
                    f"{our_score}-{opp_score} vs {opp_name} on {m['match_date']} (Season {m['season']}-{str(m['season']+1)[-2:]})"
                )
            analytics["biggest_victory_margin"] = max_margin
            analytics["biggest_victories"] = formatted_wins

            # B. Clean sheets by season
            clean_sheets_by_season = defaultdict(int)
            for m in matches:
                is_home = m["home_club_id"] == club_id
                opp_score = m["away_score"] if is_home else m["home_score"]
                if opp_score == 0:
                    clean_sheets_by_season[m["season"]] += 1
            analytics["clean_sheets_by_season"] = dict(clean_sheets_by_season)

            # C. Comeback wins (conceded first but won) since 2011
            # We filter matches where we won but trailed at half-time (guaranteed conceded first).
            comebacks = []
            for m in matches:
                if m["match_date"] and m["match_date"] >= "2011-01-01":
                    is_home = m["home_club_id"] == club_id
                    our_score = m["home_score"] if is_home else m["away_score"]
                    opp_score = m["away_score"] if is_home else m["home_score"]
                    our_ht = m["half_time_home_score"] if is_home else m["half_time_away_score"]
                    opp_ht = m["half_time_away_score"] if is_home else m["half_time_home_score"]
                    
                    if our_score is not None and opp_score is not None and our_score > opp_score:
                        if opp_ht is not None and our_ht is not None and opp_ht > our_ht:
                            opp_id = m["away_club_id"] if is_home else m["home_club_id"]
                            opp_name = club_names.get(opp_id, "Unknown")
                            comebacks.append(
                                f"{m['match_date']}: won {our_score}-{opp_score} vs {opp_name} after trailing {our_ht}-{opp_ht} at HT"
                            )
            analytics["comeback_wins_since_2011"] = comebacks

            # D. W-D-L against Barcelona since 2010
            barca_id = None
            for cid, name in club_names.items():
                if "barcelona" in name.lower():
                    barca_id = cid
                    break
            
            if barca_id:
                h2h = {"overall": [0,0,0], "home": [0,0,0], "away": [0,0,0]}
                for m in matches:
                    if m["match_date"] and m["match_date"] >= "2010-01-01":
                        is_home = m["home_club_id"] == club_id
                        opp_id = m["away_club_id"] if is_home else m["home_club_id"]
                        if opp_id == barca_id:
                            our_score = m["home_score"] if is_home else m["away_score"]
                            opp_score = m["away_score"] if is_home else m["home_score"]
                            if our_score is not None and opp_score is not None:
                                idx = 0 if our_score > opp_score else 1 if our_score == opp_score else 2
                                h2h["overall"][idx] += 1
                                if is_home:
                                    h2h["home"][idx] += 1
                                else:
                                    h2h["away"][idx] += 1
                analytics["barcelona_h2h_since_2010"] = h2h

            # E. Goals scored and conceded per season
            season_goals = {}
            for m in matches:
                is_home = m["home_club_id"] == club_id
                our_score = m["home_score"] if is_home else m["away_score"]
                opp_score = m["away_score"] if is_home else m["home_score"]
                if our_score is None or opp_score is None:
                    continue
                s = m["season"]
                if s not in season_goals:
                    season_goals[s] = {"goals_scored": 0, "goals_conceded": 0, "matches_played": 0}
                season_goals[s]["goals_scored"] += our_score
                season_goals[s]["goals_conceded"] += opp_score
                season_goals[s]["matches_played"] += 1
            analytics["goals_by_season"] = season_goals

        # 3. Fetch all player stats for the club
        players_res = (
            supabase.table("player_stats")
            .select("player_name, season, goals, assists, matches_played, minutes, position")
            .eq("club_id", club_id)
            .execute()
        )
        players = players_res.data or []

        if players:
            # A. Goals-per-minute ratio (min 10 goals in a season)
            player_ratios = []
            for p in players:
                goals = p.get("goals") or 0
                minutes = p.get("minutes") or 0
                if goals >= 10 and minutes > 0:
                    player_ratios.append({
                        "name": p["player_name"],
                        "season": p["season"],
                        "goals": goals,
                        "minutes": minutes,
                        "ratio": round(minutes / goals, 1)
                    })
            player_ratios = sorted(player_ratios, key=lambda x: x["ratio"])
            analytics["best_goals_per_minute_seasons"] = player_ratios

            # B. Cumulative player stats since 2017-18
            player_totals = {}
            for p in players:
                if p["season"] >= 2017:
                    name = p["player_name"]
                    goals = p.get("goals") or 0
                    assists = p.get("assists") or 0
                    if name not in player_totals:
                        player_totals[name] = {"goals": 0, "assists": 0, "seasons": []}
                    player_totals[name]["goals"] += goals
                    player_totals[name]["assists"] += assists
                    player_totals[name]["seasons"].append(f"{p['season']}-{str(p['season']+1)[-2:]} ({goals}g)")
            
            top_cumulative_scorers = sorted(
                [{"name": k, "goals": v["goals"], "assists": v["assists"], "breakdown": ", ".join(v["seasons"])} 
                 for k, v in player_totals.items()],
                key=lambda x: x["goals"],
                reverse=True
            )
            analytics["top_cumulative_scorers_since_2017"] = top_cumulative_scorers

    except Exception as e:
        import logging
        logging.getLogger("ballerzhq.chat").error("Error in _calculate_club_analytics: %s", e)
    
    return analytics

