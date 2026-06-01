"""
Supabase database clients

supabase         — service_role key: user-scoped reads (user_preferences) + ingest writes
supabase_anon    — anon key: public-data reads (matches, players, standings, clubs)
"""

from supabase import create_client, Client
from app.config import settings

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
supabase_anon: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
