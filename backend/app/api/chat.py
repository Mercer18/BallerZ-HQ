"""
AI Chat endpoint — RAG over the Supabase football corpus.

Builds a rich context from the user's tracked club:
- current season standings (position, points, goal difference, record)
- last 5 league matches (with score, opponent, home/away)
- previous season comparison (where applicable)
- recent stats aggregate (form, goals scored/conceded, cards)

Then asks Groq to answer the user's question grounded in that context.
"""

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
    context = build_user_context(request.user_id) if request.user_id else {}

    # ── ask the model ────────────────────────────────────────────────
    response_text = generate_response(
        message=request.message,
        mode=request.mode,
        context=context,
    )

    return ChatResponse(response=response_text)


def build_user_context(user_id: str) -> Dict[str, Any]:
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
