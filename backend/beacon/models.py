from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class OrderStatus(str, Enum):
    pending = "pending"
    cooking = "cooking"
    ready = "ready"
    delivered = "delivered"


class TableStatus(str, Enum):
    available = "available"
    occupied = "occupied"
    reserved = "reserved"
    cleaning = "cleaning"


# ─── Menu ────────────────────────────────────────────────────────────────────

class MenuItem(BaseModel):
    id: int
    cat: str
    name: str
    price: float
    prep: int
    emoji: str
    popular: bool


# ─── Tables ──────────────────────────────────────────────────────────────────

class Table(BaseModel):
    id: int
    seats: int
    status: TableStatus
    guests: Optional[int] = None
    server: Optional[str] = None
    elapsed: Optional[int] = None
    time: Optional[str] = None
    name: Optional[str] = None


class UpdateTableStatusRequest(BaseModel):
    status: TableStatus


# ─── Orders ──────────────────────────────────────────────────────────────────

class OrderItem(BaseModel):
    name: str
    qty: int


class Order(BaseModel):
    id: str
    table: int
    status: OrderStatus
    items: List[OrderItem]
    total: float
    time: int
    server: str


class CreateOrderRequest(BaseModel):
    table: int
    items: List[OrderItem]
    server: str
    total: float


class UpdateOrderStatusRequest(BaseModel):
    status: OrderStatus


# ─── Analytics ───────────────────────────────────────────────────────────────

class AnalyticsSummary(BaseModel):
    total_orders: int
    pending_count: int
    cooking_count: int
    ready_count: int
    delivered_count: int
    total_revenue: float
    avg_ticket: float
    occupied_tables: int
    available_tables: int
