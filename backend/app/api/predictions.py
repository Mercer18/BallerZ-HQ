"""
Match predictions endpoint
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.database import supabase
from app.ml.predictor import predict_match_outcome

router = APIRouter()

class PredictionRequest(BaseModel):
    match_id: int

class PredictionResponse(BaseModel):
    match_id: int
    home_win_pct: float
    draw_pct: float
    away_win_pct: float
    home_score_prediction: int
    away_score_prediction: int
    confidence: str
    reasons: List[str]

@router.post("/calculate", response_model=PredictionResponse)
async def calculate_prediction(request: PredictionRequest):
    """Calculate prediction for a specific match"""

    # Get match details
    match_data = supabase.table('matches').select("""
        *,
        home_club:home_club_id (id, name, elo_rating),
        away_club:away_club_id (id, name, elo_rating)
    """).eq('id', request.match_id).single().execute()

    if not match_data.data:
        raise HTTPException(status_code=404, detail="Match not found")

    match = match_data.data

    # Run prediction model
    prediction = predict_match_outcome(match)

    # Save prediction to database
    pred_data = {
        'match_id': request.match_id,
        'home_win_pct': prediction['home_win_pct'],
        'draw_pct': prediction['draw_pct'],
        'away_win_pct': prediction['away_win_pct'],
        'home_score_prediction': prediction['home_score'],
        'away_score_prediction': prediction['away_score'],
        'confidence': prediction['confidence'],
    }

    result = supabase.table('predictions').insert(pred_data).execute()

    return PredictionResponse(
        match_id=request.match_id,
        home_win_pct=prediction['home_win_pct'],
        draw_pct=prediction['draw_pct'],
        away_win_pct=prediction['away_win_pct'],
        home_score_prediction=prediction['home_score'],
        away_score_prediction=prediction['away_score'],
        confidence=prediction['confidence'],
        reasons=prediction['reasons']
    )

@router.get("/upcoming", response_model=List[PredictionResponse])
async def get_upcoming_predictions(limit: int = 10):
    """Get predictions for upcoming matches"""

    # Get upcoming matches with predictions
    matches = supabase.table('matches').select("""
        *,
        predictions (
            id,
            home_win_pct,
            draw_pct,
            away_win_pct,
            home_score_prediction,
            away_score_prediction,
            confidence
        ),
        home_club:home_club_id (id, name),
        away_club:away_club_id (id, name)
    """).eq('status', 'scheduled').order('date', ascending=True).limit(limit).execute()

    results = []
    for match in matches.data:
        if match.get('predictions') and len(match['predictions']) > 0:
            pred = match['predictions'][0]
            results.append(PredictionResponse(
                match_id=match['id'],
                home_win_pct=pred['home_win_pct'],
                draw_pct=pred['draw_pct'],
                away_win_pct=pred['away_win_pct'],
                home_score_prediction=pred['home_score_prediction'],
                away_score_prediction=pred['away_score_prediction'],
                confidence=pred['confidence'],
                reasons=[]
            ))

    return results
