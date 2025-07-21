"""
SQLAlchemy database configuration for async database operations
"""
import os
import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import text
from dotenv import load_dotenv

# Configure logging
logger = logging.getLogger("database")

# Load environment variables
load_dotenv()

# Get PostgreSQL connection URL (using only POSTGRES_URL as requested)
DB_URL = os.getenv("POSTGRES_URL")

# If POSTGRES_URL doesn't start with postgresql+asyncpg://, modify it
if DB_URL and DB_URL.startswith("postgresql://"):
    DB_URL = DB_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
elif not DB_URL:
    logger.error("POSTGRES_URL not found in environment variables")
    raise ValueError("POSTGRES_URL environment variable is required but was not found. Check your .env file.")

# Extract components to handle special characters correctly
try:
    # Parse the URL manually to avoid issues with special characters
    connection_parts = DB_URL.split('@')
    if len(connection_parts) > 1:
        # There's at least one @ in the URL (likely in the credentials)
        # Take the last part as the host:port/dbname
        host_part = connection_parts[-1]
        # Join all other parts with @ for the credentials portion
        creds_part = '@'.join(connection_parts[:-1])
        
        # Further split credential part
        if '://' in creds_part:
            driver, auth = creds_part.split('://', 1)
        else:
            driver, auth = 'postgresql+asyncpg', creds_part
            
        # Reconstruct URL with proper escaping
        from urllib.parse import quote_plus
        if ':' in auth:
            user, pwd = auth.split(':', 1)
            # Quote the password part
            auth = f"{user}:{quote_plus(pwd)}"
            
        DB_URL = f"{driver}://{auth}@{host_part}"
        
    logger.info(f"Using database URL: {driver}://***:***@{host_part}")
except Exception as e:
    logger.warning(f"Could not parse database URL for logging: {str(e)}")
    # Fall back to simple masking
    if '@' in DB_URL:
        logger.info(f"Using database URL: {DB_URL.split('@')[0].split(':')[0]}:***@{DB_URL.split('@')[1]}")
    else:
        logger.info("Using database URL with masked credentials")


from sqlalchemy.pool import NullPool
# Create engine with proper async configuration
engine = create_async_engine(
    DB_URL,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",
    future=True,
    pool_pre_ping=True,
    connect_args={"statement_cache_size": 0},  # Disable prepared statements
    poolclass=NullPool  # Required for PgBouncer in transaction mode
)

# Create session factory for async sessions
AsyncSessionLocal = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False,
    autoflush=False
)

# Create base model class
Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting async DB session for FastAPI endpoints
    
    Yields:
        AsyncSession: SQLAlchemy async session
        
    Example:
        ```python
        @router.get('/items')
        async def get_items(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(Item))
            return result.scalars().all()
        ```
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db() -> bool:
    """Initialize the database connection and verify it's working
    
    This function should be called at application startup.
    It verifies the database connection and logs the result.
    
    Returns:
        bool: True if connection was successful
    """
    try:
        # Create connection to verify settings
        async with engine.begin() as conn:
            # Simple query to verify connection
            await conn.execute(text('SELECT 1'))
        
        logger.info("✅ SQLAlchemy database connection established successfully!")
        return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}", exc_info=True)
        raise
