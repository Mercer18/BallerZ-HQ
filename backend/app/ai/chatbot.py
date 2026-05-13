"""
AI Chatbot with RAG-based responses
Grounded in real football data, not LLM hallucination
"""

from typing import Dict, List, Any, Optional
import os

# Use OpenAI if available, otherwise mock responses for free tier
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = bool(os.getenv('OPENAI_API_KEY'))
    if OPENAI_AVAILABLE:
        client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
except ImportError:
    OPENAI_AVAILABLE = False

# Alternative: Groq (free tier available)
try:
    from openai import OpenAI as GroqClient
    GROQ_KEY = os.getenv('GROQ_API_KEY')
    if GROQ_KEY:
        groq_client = GroqClient(
            base_url="https://api.groq.com/openai/v1",
            api_key=GROQ_KEY
        )
        GROQ_AVAILABLE = True
    else:
        GROQ_AVAILABLE = False
except ImportError:
    GROQ_AVAILABLE = False

ANALYST_SYSTEM_PROMPT = """You are BallerZ HQ Analyst Mode - a data-driven football analyst.
- Base ALL responses on the provided context (stats, form, predictions)
- Be precise, analytical, and cite specific numbers
- If you don't have data for something, say so clearly
- Keep responses concise but informative
- Use football terminology appropriately"""

HYPE_SYSTEM_PROMPT = """You are BallerZ HQ Hype Mode - an enthusiastic football fan companion.
- Bring energy and personality, but STAY GROUNDED in the provided data
- You can be more casual and emotional
- Use the stats to build excitement or drama
- If you don't have data for something, acknowledge it but keep the vibe
- No made-up transfer rumors or injury news - stick to what the data shows"""

def generate_response(
    message: str,
    mode: str,
    context: Dict[str, Any]
) -> str:
    """
    Generate a grounded response using RAG pattern:
    1. Use provided context (team stats, fixtures, predictions)
    2. Prompt LLM to respond based ONLY on that context
    """

    # Build context string from retrieved data
    context_str = build_context_string(context)

    system_prompt = ANALYST_SYSTEM_PROMPT if mode == 'analyst' else HYPE_SYSTEM_PROMPT

    # If no AI key available, return mock response
    if not OPENAI_AVAILABLE and not GROQ_AVAILABLE:
        return generate_mock_response(message, mode, context)

    # Use Groq if available (free tier)
    if GROQ_AVAILABLE:
        try:
            response = groq_client.chat.completions.create(
                model="llama-3.1-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Context:\n{context_str}\n\nUser question: {message}"}
                ],
                max_tokens=500,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Groq API error: {e}")
            return generate_mock_response(message, mode, context)

    # Use OpenAI as fallback
    if OPENAI_AVAILABLE:
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Context:\n{context_str}\n\nUser question: {message}"}
                ],
                max_tokens=500,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return generate_mock_response(message, mode, context)

    return generate_mock_response(message, mode, context)

def build_context_string(context: Dict[str, Any]) -> str:
    """Build a text context from retrieved data"""

    parts = []

    if context.get('favorite_club'):
        club = context['favorite_club']
        parts.append(f"User's favorite club: {club.get('name', 'Unknown')}")
        parts.append(f"League: {club.get('league', 'Unknown')}")
        parts.append(f"Country: {club.get('country', 'Unknown')}")

    if context.get('recent_matches'):
        parts.append("\nRecent matches:")
        for match in context['recent_matches'][:5]:
            home = match.get('home_club', {}).get('name', 'Home')
            away = match.get('away_club', {}).get('name', 'Away')
            score = f"{match.get('home_score', '-')} - {match.get('away_score', '-')}" if match.get('status') == 'finished' else 'Upcoming'
            parts.append(f"  {home} vs {away}: {score}")

    if context.get('upcoming_fixtures'):
        parts.append("\nUpcoming fixtures:")
        for fixture in context['upcoming_fixtures'][:3]:
            home = fixture.get('home_club', {}).get('name', 'Home')
            away = fixture.get('away_club', {}).get('name', 'Away')
            parts.append(f"  {home} vs {away}")

    return "\n".join(parts)

def generate_mock_response(message: str, mode: str, context: Dict[str, Any]) -> str:
    """Generate a response without calling LLM API by extracting real data from the context."""
    
    club = context.get('favorite_club', {})
    club_name = club.get('name', 'your club')
    position = club.get('league_position', '?')
    points = club.get('points', '?')
    
    recent = context.get('recent_matches', [])
    upcoming = context.get('upcoming_fixtures', [])
    
    if mode == 'analyst':
        response = f"[Analyst Mode - Local Data Fallback]\n\nRegarding {club_name}, here is the verified data:\n"
        response += f"• Current Standing: Position {position} with {points} points.\n"
        
        if recent:
            last = recent[0]
            home = last.get('home_club', {}).get('name', 'Home')
            away = last.get('away_club', {}).get('name', 'Away')
            score = f"{last.get('home_score', '-')} - {last.get('away_score', '-')}"
            response += f"• Last Match: {home} {score} {away}.\n"
            
        if upcoming:
            next_m = upcoming[0]
            home = next_m.get('home_club', {}).get('name', 'Home')
            away = next_m.get('away_club', {}).get('name', 'Away')
            response += f"• Next Fixture: {home} vs {away}.\n"
            
        response += "\nTo get true AI tactical analysis and conversational memory, configure the Groq/OpenAI API key."
        return response

    else:  # hype mode
        response = f"[Hype Mode - Local Data Fallback]\n\nLET'S GO {club_name.upper()}! 🔥\n"
        
        if recent:
            last = recent[0]
            is_win = False
            if last.get('home_club_id') == club.get('id'):
                is_win = float(last.get('home_score', 0)) > float(last.get('away_score', 0))
            else:
                is_win = float(last.get('away_score', 0)) > float(last.get('home_score', 0))
                
            if is_win:
                response += "Huge dub in the last match! The boys are cooking! 🍳\n"
            else:
                response += "Tough result last time out, but we bounce back! 💪\n"
                
        if upcoming:
             away = upcoming[0].get('away_club', {}).get('name', 'Away')
             home = upcoming[0].get('home_club', {}).get('name', 'Home')
             opp = away if home == club_name else home
             response += f"We've got {opp} next. Time to show them who's boss!\n"
             
        response += "\n(P.S. Connect an API key to unlock my full hype potential! 🚀)"
        return response
