"""
AI Chat endpoint with RAG-based responses
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database import supabase
from app.ai.chatbot import generate_response

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    mode: str = "analyst"  # 'analyst' or 'hype'
    user_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    sources: list = []

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with the AI assistant.

    Responses are grounded in real football data from the database,
    not pure LLM generation.
    """

    # Get user preferences for context
    user_context = {}
    if request.user_id:
        prefs = supabase.table('user_preferences').select("""
            *,
            clubs (id, name, league, country)
        """).eq('user_id', request.user_id).single().execute()

        if prefs.data:
            user_context = {
                'favorite_club': prefs.data.get('clubs'),
                'favorite_country': prefs.data.get('favorite_country')
            }

    # Get recent team stats for grounding
    if user_context.get('favorite_club'):
        club_id = user_context['favorite_club'].get('id')

        # Get recent matches
        recent_matches = supabase.table('matches').select("""
            *,
            home_club:home_club_id (name),
            away_club:away_club_id (name)
        """).or_(f"home_club_id.eq.{club_id},away_club_id.eq.{club_id}").order('date', ascending=False).limit(5).execute()

        user_context['recent_matches'] = recent_matches.data

        # Get upcoming fixtures
        upcoming = supabase.table('matches').select("""
            *,
            home_club:home_club_id (name),
            away_club:away_club_id (name)
        """).eq('status', 'scheduled').or_(f"home_club_id.eq.{club_id},away_club_id.eq.{club_id}").order('date', ascending=True).limit(3).execute()

        user_context['upcoming_fixtures'] = upcoming.data

    # Generate grounded response
    response_text = generate_response(
        message=request.message,
        mode=request.mode,
        context=user_context
    )

    return ChatResponse(response=response_text)
