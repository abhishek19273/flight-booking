import os
import sys
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, airports, flights, bookings, payments, flight_admin
from app.database.init_db import init_db, logger as db_logger
import uvicorn

# Configure logging for the main application
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

# Create FastAPI app
app = FastAPI(
    title="SkyBound Journeys API",
    description="API for the SkyBound Journeys flight booking system",
    version="1.0.0",
)

# Configure CORS
origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # React dev server
    "http://localhost:8000",  # FastAPI server
    # Add your production domain here
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
    expose_headers=["Content-Type", "Authorization"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(airports.router, prefix="/airports", tags=["Airports"])
app.include_router(flights.router, prefix="/flights", tags=["Flights"])
app.include_router(bookings.router, prefix="/bookings", tags=["Bookings"])
app.include_router(payments.router, prefix="/payments", tags=["Payments"])
app.include_router(flight_admin.router, prefix="/admin/flights", tags=["Flight Administration"])

@app.on_event("startup")
async def startup_event():
    logger.info("Starting SkyBound Journeys API...")
    try:
        # Initialize database connection
        logger.info("Initializing database connection...")
        await init_db()
        logger.info("Database connection initialized successfully")
        
        # Check if migrations should be run automatically on startup
        if os.getenv("AUTO_MIGRATE", "false").lower() == "true":
            logger.info("Running database migrations automatically...")
            try:
                import subprocess
                from pathlib import Path
                project_root = Path(__file__).parent.parent
                result = subprocess.run(["alembic", "upgrade", "head"], 
                                      cwd=str(project_root),
                                      capture_output=True, 
                                      text=True)
                if result.returncode == 0:
                    logger.info("✅ Auto-migrations completed successfully")
                else:
                    logger.warning(f"⚠️ Migration issue: {result.stderr}")
            except Exception as e:
                logger.error(f"Failed to run migrations: {e}", exc_info=True)
                # Continue startup even if migrations fail
        
        logger.info("SkyBound Journeys API startup complete")
    except Exception as e:
        logger.error(f"Failed to initialize application: {e}", exc_info=True)
        # Re-raise the exception to prevent app startup if critical initialization fails
        raise

@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint - returns basic API information
    """
    return {
        "message": "Welcome to the SkyBound Journeys API",
        "docs": "/docs",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=3000, reload=True)
