import os
import logging
import warnings
from supabase import create_client, Client
from dotenv import load_dotenv
from typing import Optional, AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database.database import AsyncSessionLocal, init_db as init_sqlalchemy_db, Base

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('database')

# Load environment variables
load_dotenv()

# Supabase credentials from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Global Supabase client (legacy)
supabase_client: Optional[Client] = None

async def init_db():
    """Initialize database connections for SQLAlchemy, with legacy Supabase support
    
    This function sets up the primary async SQLAlchemy connection and,
    if configured, also initializes the legacy Supabase client that's being phased out.
    """
    global supabase_client
    
    # Initialize SQLAlchemy database connection
    logger.info("Initializing SQLAlchemy database connection")
    try:
        # Test SQLAlchemy connection
        success = await init_sqlalchemy_db()
        if not success:
            raise Exception("SQLAlchemy database connection failed")
    except Exception as e:
        logger.error(f"Failed to connect to database with SQLAlchemy: {e}", exc_info=True)
        raise
    
    # Supabase client initialization for auth and legacy features
    if SUPABASE_URL and SUPABASE_KEY:
        # Note: While we're using SQLAlchemy for data access, we still need Supabase for auth
        logger.info("Initializing Supabase client for authentication and legacy features")

        
        # Create Supabase client if it doesn't exist
        if supabase_client is None:
            logger.info("Initializing legacy Supabase client connection")
            supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Verify Supabase connection
        try:
            # Simple test query to verify connection
            try:
                response = supabase_client.table("airlines").select("id").limit(1).execute()
                logger.info("✅ Supabase connection established successfully!")
            except Exception as query_error:
                # If the error is that the table doesn't exist, this might be a first run
                if "relation \"airlines\" does not exist" in str(query_error).lower():
                    logger.info("Airlines table does not exist yet. This might be a first run before migrations.")
                else:
                    logger.warning(f"Supabase connection warning: {query_error}")
        except Exception as e:
            # Just log the error but don't raise, as we're transitioning to SQLAlchemy
            logger.warning(f"Issue with legacy Supabase connection: {e}", exc_info=True)
    else:
        logger.info("Supabase credentials not found or disabled, using SQLAlchemy exclusively")

def get_supabase_client() -> Client:
    """Get the global Supabase client (legacy method)
    
    Deprecated: This method is maintained for backward compatibility.
    New code should use SQLAlchemy async sessions instead.
    
    Returns:
        Client: Initialized Supabase client
        
    Raises:
        Exception: If client is not initialized or Supabase support is disabled
    """
    warnings.warn(
        "get_supabase_client() is deprecated. Use SQLAlchemy ORM models and async sessions instead.",
        DeprecationWarning, stacklevel=2
    )
    
    if supabase_client is None:
        raise Exception("Legacy Supabase client not initialized or disabled. Use SQLAlchemy async sessions instead.")
    return supabase_client


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting async DB session in FastAPI endpoints"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def check_table_exists(table_name: str) -> bool:
    """Check if a table exists in the database using SQLAlchemy
    
    Args:
        table_name: Name of the table to check
        
    Returns:
        bool: True if the table exists, False otherwise
    """
    try:
        async with AsyncSessionLocal() as session:
            # Using text() from sqlalchemy.sql for safe parameter passing
            from sqlalchemy.sql import text
            result = await session.execute(text(f"SELECT to_regclass('public.{table_name}')::text"))
            return result.scalar() is not None
    except Exception as e:
        logger.error(f"Error checking if table {table_name} exists: {e}", exc_info=True)
        return False
        return False
