"""
Solara — Real Estate Listings Platform
FastAPI Backend

Endpoints:
  GET    /api/properties              — All properties (filterable + sortable)
  GET    /api/properties/{id}         — Single property detail
  POST   /api/properties/{id}/save    — Save or unsave a property
  GET    /api/properties/saved        — All saved properties
  POST   /api/properties/{id}/contact — Submit agent contact request
  GET    /api/summary                 — Market summary analytics

Run locally:
  pip install -r requirements.txt
  uvicorn main:app --reload --port 8002

Docs at: http://localhost:8002/docs
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

from models import (
    Property, PropertyType, SortOrder,
    SavePropertyRequest, ContactAgentRequest,
    PropertySummary,
)
from data import PROPERTIES, SAVED_PROPERTY_IDS

app = FastAPI(
    title="Solara Real Estate API",
    description="Property listings backend for Solara by Stage Labs",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Property endpoints ───────────────────────────────────────────────────────

@app.get("/api/properties", response_model=list[Property], tags=["Properties"])
async def get_properties(
    type: Optional[PropertyType] = Query(None, description="Filter by property type"),
    min_beds: Optional[int] = Query(None, ge=1, description="Minimum number of bedrooms"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    search: Optional[str] = Query(None, description="Search by title or city"),
    sort: SortOrder = Query(SortOrder.featured, description="Sort order"),
):
    """
    Return all property listings.
    Supports filtering by type, beds, price range, and text search.
    Supports sorting by featured, price ascending, or price descending.
    """
    results = PROPERTIES.copy()

    if type:
        results = [p for p in results if p.type == type]

    if min_beds:
        results = [p for p in results if p.beds >= min_beds]

    if min_price:
        results = [p for p in results if p.price >= min_price]

    if max_price:
        results = [p for p in results if p.price <= max_price]

    if search:
        query = search.lower()
        results = [
            p for p in results
            if query in p.title.lower() or query in p.city.lower() or query in p.address.lower()
        ]

    # Apply sort
    if sort == SortOrder.featured:
        results.sort(key=lambda p: p.featured, reverse=True)
    elif sort == SortOrder.price_asc:
        results.sort(key=lambda p: p.price)
    elif sort == SortOrder.price_desc:
        results.sort(key=lambda p: p.price, reverse=True)

    return results


@app.get("/api/properties/saved", response_model=list[Property], tags=["Properties"])
async def get_saved_properties():
    """Return all properties the user has saved."""
    return [p for p in PROPERTIES if p.id in SAVED_PROPERTY_IDS]


@app.get("/api/properties/{property_id}", response_model=Property, tags=["Properties"])
async def get_property(property_id: int):
    """Return a single property by ID."""
    prop = next((p for p in PROPERTIES if p.id == property_id), None)
    if not prop:
        raise HTTPException(status_code=404, detail=f"Property {property_id} not found")
    return prop


@app.post("/api/properties/{property_id}/save", tags=["Properties"])
async def save_property(property_id: int, body: SavePropertyRequest):
    """
    Save or unsave a property.
    Returns the updated saved state.
    """
    prop = next((p for p in PROPERTIES if p.id == property_id), None)
    if not prop:
        raise HTTPException(status_code=404, detail=f"Property {property_id} not found")

    if body.saved:
        SAVED_PROPERTY_IDS.add(property_id)
    else:
        SAVED_PROPERTY_IDS.discard(property_id)

    return {
        "property_id": property_id,
        "saved": property_id in SAVED_PROPERTY_IDS,
        "total_saved": len(SAVED_PROPERTY_IDS),
    }


@app.post("/api/properties/{property_id}/contact", tags=["Properties"])
async def contact_agent(property_id: int, body: ContactAgentRequest):
    """
    Submit a tour request or agent contact form for a property.
    In production this would send an email or trigger a CRM workflow.
    """
    prop = next((p for p in PROPERTIES if p.id == property_id), None)
    if not prop:
        raise HTTPException(status_code=404, detail=f"Property {property_id} not found")

    # In production: send email, create CRM lead, trigger notification
    return {
        "success": True,
        "message": f"Tour request received for {prop.title}. {prop.agent} will contact you shortly.",
        "property_id": property_id,
        "agent": prop.agent,
        "contact_name": body.name,
    }


# ─── Summary endpoint ─────────────────────────────────────────────────────────

@app.get("/api/summary", response_model=PropertySummary, tags=["Analytics"])
async def get_summary():
    """Return market summary statistics."""
    total = len(PROPERTIES)
    avg_price = sum(p.price for p in PROPERTIES) / total if total else 0

    return PropertySummary(
        total_listings=total,
        available_houses=sum(1 for p in PROPERTIES if p.type == PropertyType.house),
        available_condos=sum(1 for p in PROPERTIES if p.type == PropertyType.condo),
        available_townhomes=sum(1 for p in PROPERTIES if p.type == PropertyType.townhome),
        avg_price=round(avg_price, 2),
        featured_count=sum(1 for p in PROPERTIES if p.featured),
    )


# ─── Health check ─────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok", "service": "Solara Real Estate API", "version": "1.0.0"}
