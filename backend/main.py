"""
BallerZ HQ Backend API
FastAPI service for historical football data, AI chat, and data pipelines
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os

from app.api import chat, data, matches, players, international, auth

app = FastAPI(
    title="BallerZ HQ API",
    description="Historical football data and AI assistant backend",
    version="0.1.0"
)

# CORS - allow frontend to connect
from app.config import settings

cors_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    settings.FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(matches.router, prefix="/api/matches", tags=["matches"])
app.include_router(players.router, prefix="/api/players", tags=["players"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(data.router, prefix="/api/data", tags=["data"])
app.include_router(international.router, prefix="/api/intl", tags=["international"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

@app.get("/")
async def root():
    return {
        "service": "BallerZ HQ API",
        "version": "0.1.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

