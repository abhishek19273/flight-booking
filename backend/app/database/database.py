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

# Get PostgreSQL connection details
DB_URL = os.getenv("POSTGRES_URL")

# If POSTGRES_URL doesn't start with postgresql+asyncpg://, modify it
if DB_URL and DB_URL.startswith("postgresql://"):
    DB_URL = DB_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
elif not DB_URL:
    # Build the URL from individual components
    pg_user = os.getenv("POSTGRES_USER")
    pg_password = os.getenv("POSTGRES_PASSWORD")
    pg_host = os.getenv("POSTGRES_HOST")
    pg_port = os.getenv("POSTGRES_PORT", "5432")
    pg_database = os.getenv("POSTGRES_DB")
    
    if all([pg_user, pg_password, pg_host, pg_database]):
        DB_URL = f"postgresql+asyncpg://{pg_user}:{pg_password}@{pg_host}:{pg_port}/{pg_database}"
    else:
        logger.error("Database connection details not found in environment variables")
        raise ValueError("Database connection URL could not be constructed. Check environment variables.")

# Create engine with proper async configuration
engine = create_async_engine(
    DB_URL,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",
    pool_pre_ping=True,
    pool_size=int(os.getenv("DB_POOL_SIZE", "5")),
    max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "10"))
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
