#!/usr/bin/env python
"""
SkyBound Journeys Database Management Script
"""
import os
import sys
import subprocess
import argparse
import asyncio
from pathlib import Path
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("manage")

# Load environment variables from .env file
load_dotenv()

# Path to backend directory
BACKEND_DIR = Path(__file__).resolve().parent

# Add the project root to the Python path for imports to work
sys.path.append(str(BACKEND_DIR))

# Import after setting the path
from app.database.database import engine
from app.database.init_db import init_db, check_table_exists
from sqlalchemy.sql import text

def run_command(command):
    """Run a command with 'uv run'"""
    full_command = ["uv", "run"] + command
    print(f"Running: {' '.join(full_command)}")
    process = subprocess.run(full_command, cwd=str(BACKEND_DIR), capture_output=True, text=True)
    if process.returncode != 0:
        print(f"❌ Command failed: {process.stderr}")
        return False
    print(process.stdout)
    return True

async def migrate():
    """Run database migrations"""
    logger.info("Running database migrations...")
    if run_command(["alembic", "upgrade", "head"]):
        logger.info("✅ Migrations completed successfully!")
        print("\n✅ Migrations completed successfully!")
    else:
        logger.error("Migration failed.")
        print("\n❌ Migration failed.")


def create_migration(name):
    """Create a new migration file based on SQLAlchemy model changes"""
    if not name:
        print("Error: Migration name is required")
        sys.exit(1)
    
    logger.info(f"Creating new migration: {name}")
    if run_command(["alembic", "revision", "--autogenerate", "-m", name]):
        print(f"\n✅ Created migration: {name}")
        print("\n⚠️ Please review the generated migration file in alembic/versions/ directory.")
    else:
        print("❌ Failed to create migration")
        sys.exit(1)

def migration_status():
    """Show migration status"""
    run_command(["alembic", "current"])
    print("\nMigration history:")
    run_command(["alembic", "history"])

async def db_status():
    """Check database status and tables"""
    await init_db()
    print("Database connection: Connected ✓")
    tables = ["users", "airlines", "airports", "flights", "bookings", "booking_flights", "passengers", "payments"]
    print("\nChecking tables:")
    
    all_exist = True
    for table in tables:
        exists = await check_table_exists(table)
        status = "✓ Exists" if exists else "✗ Missing"
        if not exists:
            all_exist = False
        print(f"  {table}: {status}")
        
    if not all_exist:
        print("\n⚠️  Some tables are missing! Run 'uv run python manage.py migrate' to create them.")
    else:
        print("\n✅ All essential tables exist.")

async def init_db_schema():
    """Generate initial schema from scratch"""
    try:
        logger.info("Installing PostgreSQL UUID extension...")
        print("Installing PostgreSQL UUID extension...")
        async with engine.begin() as conn:
            await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'))
        print("✅ UUID extension installed or already exists.")
        
        await migrate()
    except Exception as e:
        logger.error(f"Failed to apply initial schema: {e}", exc_info=True)
        print(f"❌ Failed to apply initial schema: {e}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="SkyBound Journeys Database Management")
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # Migrate command
    migrate_parser = subparsers.add_parser("migrate", help="Run pending database migrations")
    
    # Create migration command
    create_parser = subparsers.add_parser("makemigration", help="Create a new migration")
    create_parser.add_argument("name", help="Name of the migration")
    
    # Status command
    status_parser = subparsers.add_parser("status", help="Show migration status")
    
    # DB status command
    dbstatus_parser = subparsers.add_parser("dbstatus", help="Check database status and tables")
    
    # Init schema command
    init_parser = subparsers.add_parser("initdb", help="Initialize database schema")
    
    args = parser.parse_args()
    
    if args.command == "migrate":
        asyncio.run(run_migrations())
    elif args.command == "makemigration":
        create_migration(args.name)
    elif args.command == "status":
        migration_status()
    elif args.command == "dbstatus":
        asyncio.run(db_status())
    elif args.command == "initdb":
        asyncio.run(init_db_schema())  # Use asyncio.run for async function
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
