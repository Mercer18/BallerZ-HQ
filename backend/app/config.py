"""
Application configuration
"""

import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str          # service_role — user-scoped reads + ingest writes
    SUPABASE_ANON_KEY: str     # anon — public-data reads (matches, players, standings)

    # AI (optional — chat falls back to mock if missing)
    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""

    # Frontend URL for CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # Ingest auth — token required to hit /api/data/ingest/*
    INGEST_TOKEN: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"  # tolerate legacy keys like FOOTBALL_API_KEY in .env

settings = Settings()
