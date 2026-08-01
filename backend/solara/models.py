"""
Solara Real Estate Platform — Pydantic Models
"""

from pydantic import BaseModel, field_validator
from typing import Optional
from enum import Enum


class PropertyType(str, Enum):
    house = "House"
    condo = "Condo"
    townhome = "Townhome"


class PriceRange(str, Enum):
    any = "Any Price"
    under_500k = "Under $500k"
    mid = "$500k–$1M"
    high = "$1M–$2M"
    luxury = "$2M+"


class SortOrder(str, Enum):
    featured = "featured"
    price_asc = "price-asc"
    price_desc = "price-desc"


class Agent(BaseModel):
    name: str
    rating: float


class Property(BaseModel):
    id: int
    type: PropertyType
    title: str
    address: str
    city: str
    price: float
    beds: int
    baths: float
    sqft: int
    lot: Optional[str] = None
    built: int
    photos: int
    rating: float
    agent: str
    featured: bool
    tags: list[str]
    color: str
    bg: str


class SavePropertyRequest(BaseModel):
    saved: bool


class ContactAgentRequest(BaseModel):
    name: str
    phone: str
    message: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_required(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name is required")
        return v.strip()

    @field_validator("phone")
    @classmethod
    def phone_required(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Phone number is required")
        return v.strip()


class PropertySummary(BaseModel):
    total_listings: int
    available_houses: int
    available_condos: int
    available_townhomes: int
    avg_price: float
    featured_count: int
