from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from app.schemas.flight import AirportResponse, AirportDetailResponse
from app.database.init_db import get_supabase_client

router = APIRouter()


@router.get("", response_model=List[AirportResponse])
async def search_airports(
    query: Optional[str] = Query(None, description="Search term for airport name, city, or IATA code"),
    limit: int = Query(10, description="Maximum number of results to return")
):
    """
    Search for airports by name, city, or IATA code
    """
    supabase = get_supabase_client()
    
    # Base query
    db_query = supabase.table("airports").select("id, iata_code, name, city, country")
    
    # Apply search filter if query provided
    if query and len(query) >= 2:
        # Search across multiple fields
        db_query = db_query.or_(
            f"iata_code.ilike.%{query}%," + 
            f"name.ilike.%{query}%," +
            f"city.ilike.%{query}%"
        )
    
    # Limit results and execute
    response = db_query.limit(limit).execute()
    
    if hasattr(response, "error") and response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {response.error}"
        )
    
    return response.data


@router.get("/cache", response_model=List[AirportResponse])
async def get_airports_for_cache():
    """
    Get all airports for client-side caching in IndexedDB
    """
    supabase = get_supabase_client()
    
    # Get all airports for caching
    response = supabase.table("airports").select("id, iata_code, name, city, country").execute()
    
    if hasattr(response, "error") and response.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {response.error}"
        )
    
    return response.data


@router.get("/{airport_id}", response_model=AirportDetailResponse)
async def get_airport(airport_id: str):
    """
    Get detailed airport information by ID
    """
    supabase = get_supabase_client()
    
    # Get airport by ID
    response = supabase.table("airports").select("*").eq("id", airport_id).single().execute()
    
    if hasattr(response, "error") and response.error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Airport with ID {airport_id} not found"
        )
    
    return response.data
