import os
from dotenv import load_dotenv
from supabase import create_client, Client
from gotrue import SyncGoTrueClient

# Load environment variables
load_dotenv()

# Get Supabase credentials from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials. Please check your .env file.")

def get_supabase_client() -> Client:
    """
    Returns a Supabase client instance
    """
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def get_gotrue_client() -> SyncGoTrueClient:
    """
    Returns a GoTrue client for authentication operations
    """
    supabase = get_supabase_client()
    return supabase.auth
