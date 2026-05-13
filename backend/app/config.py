"""
Application configuration
"""

import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str

    # AI
    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""

    # Football API
    FOOTBALL_API_KEY: str
    FOOTBALL_API_BASE_URL: str = "https://v3.football.api-sports.io"

    # Frontend URL for CORS
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

settings = Settings()
