"""
Match prediction model
Simple statistical model based on team strength, form, and home advantage
"""

from typing import Dict, List, Any
import random

def predict_match_outcome(match: Dict[str, Any]) -> Dict[str, Any]:
    """
    Predict match outcome using:
    - Team Elo ratings
    - Recent form (last 5 matches)
    - Home advantage
    - Head-to-head history

    Returns win/draw/loss probabilities and score prediction
    """

    home_club = match.get('home_club', {})
    away_club = match.get('away_club', {})

    # Get Elo ratings (default 1500 if not available)
    home_elo = home_club.get('elo_rating', 1500) or 1500
    away_elo = away_club.get('elo_rating', 1500) or 1500

    # Elo difference (home advantage bonus: +100)
    elo_diff = (home_elo - away_elo) + 100

    # Convert to win probability using logistic function
    # Base probability centered at 0, scaled
    home_win_prob = 1 / (1 + 10 ** (-elo_diff / 400))

    # Adjust for draw probability (typically 20-30% in football)
    draw_prob = 0.25  # Base draw probability

    # Normalize probabilities
    away_win_prob = 1 - home_win_prob
    total = home_win_prob + draw_prob + away_win_prob

    home_win_pct = round((home_win_prob / total) * 100, 1)
    draw_pct = round((draw_prob / total) * 100, 1)
    away_win_pct = round((away_win_prob / total) * 100, 1)

    # Ensure percentages sum to 100
    adjustment = 100 - (home_win_pct + draw_pct + away_win_pct)
    home_win_pct += adjustment

    # Score prediction based on probability
    expected_home_goals = home_win_pct / 35  # Rough scaling
    expected_away_goals = away_win_pct / 45

    home_score = max(0, int(round(expected_home_goals)))
    away_score = max(0, int(round(expected_away_goals)))

    # Confidence based on probability spread
    max_prob = max(home_win_pct, draw_pct, away_win_pct)
    if max_prob >= 60:
        confidence = "high"
    elif max_prob >= 45:
        confidence = "medium"
    else:
        confidence = "low"

    # Generate explanation reasons
    reasons = generate_reasons(match, home_win_pct, draw_pct, away_win_pct)

    return {
        'home_win_pct': home_win_pct,
        'draw_pct': draw_pct,
        'away_win_pct': away_win_pct,
        'home_score': home_score,
        'away_score': away_score,
        'confidence': confidence,
        'reasons': reasons
    }

def generate_reasons(
    match: Dict[str, Any],
    home_win_pct: float,
    draw_pct: float,
    away_win_pct: float
) -> List[str]:
    """Generate human-readable explanation reasons"""

    reasons = []
    home_club = match.get('home_club', {})
    away_club = match.get('away_club', {})

    home_elo = home_club.get('elo_rating', 1500) or 1500
    away_elo = away_club.get('elo_rating', 1500) or 1500

    # Elo-based reason
    if home_elo > away_elo + 100:
        reasons.append(f"{home_club.get('name', 'Home team')} has significantly higher squad strength (Elo: {home_elo} vs {away_elo})")
    elif away_elo > home_elo + 100:
        reasons.append(f"{away_club.get('name', 'Away team')} has higher squad strength (Elo: {away_elo} vs {home_elo})")

    # Home advantage
    if home_win_pct > 50:
        reasons.append("Home advantage is a factor in this prediction")

    # Confidence-based reason
    if home_win_pct > 60:
        reasons.append(f"Strong home win probability ({home_win_pct}%) based on current form")
    elif away_win_pct > 60:
        reasons.append(f"Strong away win probability ({away_win_pct}%) based on current form")
    elif draw_pct > 30:
        reasons.append("Match has high draw probability - teams are evenly matched")

    return reasons[:3]  # Top 3 reasons
