# SkyBound Journeys Backend

## Overview

This is the backend server for SkyBound Journeys, a flight booking application. It's built with FastAPI and uses an async SQLAlchemy ORM with Alembic migrations for database management.

## Tech Stack

- **FastAPI** - Modern, fast web framework for building APIs
- **SQLAlchemy** - Async ORM for database interactions
- **Alembic** - Database migration tool
- **PostgreSQL** - Database backend
- **Pydantic** - Data validation and settings management
- **uv** - Modern Python package manager and installer

## Setup and Installation

### Prerequisites

- Python 3.9+
- PostgreSQL database
- uv package manager (`pip install uv`)

### Environment Setup

Create a `.env` file in the backend directory with the following variables:

```
# PostgreSQL Connection
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=skyboundjourneys

# Or use a single URL
# POSTGRES_URL=postgresql://postgres:your_password@localhost:5432/skyboundjourneys

# Legacy Supabase details (optional, will be deprecated)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# App settings
API_VERSION=v1
DEBUG=true
SQL_ECHO=false
ALLOW_ORIGINS=http://localhost:3000
```

### Install Dependencies

Using the uv package manager:

```bash
# Install uv if you haven't already
pip install uv

# Install dependencies from pyproject.toml
uv pip install -e .

# For development dependencies
uv pip install -e ".[dev]"
```

## Database Management

### Running Migrations

To apply all migrations:

```bash
uv run python manage.py migrate
```

To create a new migration:

```bash
uv run python manage.py makemigration "description of changes"
```

### Migration Files

The project includes three migration files:

1. **001_initial_schema.py** - Creates the initial database schema including tables, constraints, and indexes
2. **002_seed_data_and_search_functions.py** - Seeds the database with test data and creates search functions
3. **003_indian_flight_data_and_indexes.py** - Adds India-specific flight data and additional indexes

## Running the Server

```bash
# Development mode
uv run uvicorn app.main:app --reload --port 8000

# Or using the management script
uv run python manage.py runserver
```

## API Documentation

Once the server is running, access the API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Architecture

### Database Connection

The application uses async SQLAlchemy for database operations. The connection is configured in `app/database/database.py` and initialized in `app/database/init_db.py`.

Legacy Supabase client support is maintained for backward compatibility but will be deprecated in future versions.

### Models

SQLAlchemy ORM models are defined in the `app/models` directory. Each table has a corresponding model class.

### Dependency Injection

To use the database in a FastAPI endpoint:

```python
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from app.database.init_db import get_db

@app.get("/example")
async def example_endpoint(db: AsyncSession = Depends(get_db)):
    # Use the db session here
    result = await db.execute(select(YourModel))
    return result.scalars().all()
```

## Development

### Code Formatting and Linting

```bash
# Format code
uv run black app tests

# Sort imports
uv run isort app tests

# Lint with flake8
uv run flake8 app tests

# Type checking
uv run mypy app
```

### Running Tests

```bash
uv run pytest
```

## Production Deployment

For production deployment, make sure to set appropriate environment variables and disable debug mode.
