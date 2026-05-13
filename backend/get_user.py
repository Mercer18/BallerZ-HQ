import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(r"X:\CODING\PROJECTS\webdev\BallerZ-AI\backend\.env")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")  # needs service role or anon

supabase: Client = create_client(url, key)

# Try fetching user id from user_preferences (since policies might allow read if it's open, but it's probably RLS protected)
# If RLS blocks it, we might need service_role key.
response = supabase.table("user_preferences").select("*").execute()
print(response.data)

