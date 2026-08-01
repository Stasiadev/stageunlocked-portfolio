"""
Beacon — Restaurant Order Management System
FastAPI Backend

Endpoints:
  GET    /api/menu                        — All menu items
  GET    /api/menu/{item_id}              — Single menu item
  GET    /api/tables                      — All tables
  PATCH  /api/tables/{table_id}/status   — Update table status
  GET    /api/orders                      — All orders (filterable by status)
  POST   /api/orders                      — Create new order
  PATCH  /api/orders/{order_id}/status   — Advance order status
  GET    /api/analytics                   — Summary analytics

Run locally:
  pip install -r requirements.txt
  uvicorn main:app --reload --port 8000

Docs available at:
  http://localhost:8000/docs
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import uuid

from models import (
    MenuItem,
    Table,
    Order,
    AnalyticsSummary,
    CreateOrderRequest,
    UpdateOrderStatusRequest,
    UpdateTableStatusRequest,
    OrderStatus,
    TableStatus,
)
from data import MENU_ITEMS, TABLES, ORDERS, ORDER_STATUSES

app = FastAPI(
    title="Beacon API",
    description="Restaurant order management backend for Beacon by Stage Labs",
    version="1.0.0",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
# Allow the React frontend to call this API during local development

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Menu endpoints ───────────────────────────────────────────────────────────

@app.get("/api/menu", response_model=list[MenuItem], tags=["Menu"])
async def get_menu(cat: Optional[str] = Query(None, description="Filter by category")):
    """
    Return all menu items.
    Optionally filter by category: Starters, Mains, Desserts, Drinks.
    """
    if cat:
        return [item for item in MENU_ITEMS if item.cat.lower() == cat.lower()]
    return MENU_ITEMS


@app.get("/api/menu/{item_id}", response_model=MenuItem, tags=["Menu"])
async def get_menu_item(item_id: int):
    """Return a single menu item by ID."""
    item = next((i for i in MENU_ITEMS if i.id == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail=f"Menu item {item_id} not found")
    return item


# ─── Table endpoints ──────────────────────────────────────────────────────────

@app.get("/api/tables", response_model=list[Table], tags=["Tables"])
async def get_tables(status: Optional[TableStatus] = Query(None, description="Filter by status")):
    """
    Return all tables.
    Optionally filter by status: available, occupied, reserved, cleaning.
    """
    if status:
        return [t for t in TABLES if t.status == status]
    return TABLES


@app.patch("/api/tables/{table_id}/status", response_model=Table, tags=["Tables"])
async def update_table_status(table_id: int, body: UpdateTableStatusRequest):
    """Update a table's status."""
    table = next((t for t in TABLES if t.id == table_id), None)
    if not table:
        raise HTTPException(status_code=404, detail=f"Table {table_id} not found")

    table.status = body.status

    # Clear occupancy data when table becomes available or cleaning
    if body.status in (TableStatus.available, TableStatus.cleaning):
        table.guests = None
        table.server = None
        table.elapsed = None

    return table


# ─── Order endpoints ──────────────────────────────────────────────────────────

@app.get("/api/orders", response_model=list[Order], tags=["Orders"])
async def get_orders(status: Optional[OrderStatus] = Query(None, description="Filter by status")):
    """
    Return all orders.
    Optionally filter by status: pending, cooking, ready, delivered.
    """
    if status:
        return [o for o in ORDERS if o.status == status]
    return ORDERS


@app.post("/api/orders", response_model=Order, status_code=201, tags=["Orders"])
async def create_order(body: CreateOrderRequest):
    """
    Create a new order.
    New orders always start with status: pending.
    """
    # Validate table exists
    table = next((t for t in TABLES if t.id == body.table), None)
    if not table:
        raise HTTPException(status_code=404, detail=f"Table {body.table} not found")

    # Validate all items exist on the menu
    menu_names = {item.name for item in MENU_ITEMS}
    for order_item in body.items:
        if order_item.name not in menu_names:
            raise HTTPException(
                status_code=400,
                detail=f"Menu item '{order_item.name}' does not exist"
            )

    new_order = Order(
        id=f"ORD-{str(uuid.uuid4())[:6].upper()}",
        table=body.table,
        status=OrderStatus.pending,
        items=body.items,
        total=body.total,
        time=0,
        server=body.server,
    )

    ORDERS.append(new_order)
    return new_order


@app.patch("/api/orders/{order_id}/status", response_model=Order, tags=["Orders"])
async def update_order_status(order_id: str, body: UpdateOrderStatusRequest):
    """
    Update an order's status.
    Valid transitions: pending → cooking → ready → delivered.
    """
    order = next((o for o in ORDERS if o.id == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    # Enforce status progression — can't go backwards
    current_index = ORDER_STATUSES.index(order.status.value)
    new_index = ORDER_STATUSES.index(body.status.value)

    if new_index < current_index:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot move order from '{order.status}' back to '{body.status}'"
        )

    order.status = body.status
    return order


# ─── Analytics endpoint ───────────────────────────────────────────────────────

@app.get("/api/analytics", response_model=AnalyticsSummary, tags=["Analytics"])
async def get_analytics():
    """Return summary analytics for the current service period."""
    delivered = [o for o in ORDERS if o.status == OrderStatus.delivered]
    total_revenue = sum(o.total for o in ORDERS)
    avg_ticket = total_revenue / len(ORDERS) if ORDERS else 0

    return AnalyticsSummary(
        total_orders=len(ORDERS),
        pending_count=sum(1 for o in ORDERS if o.status == OrderStatus.pending),
        cooking_count=sum(1 for o in ORDERS if o.status == OrderStatus.cooking),
        ready_count=sum(1 for o in ORDERS if o.status == OrderStatus.ready),
        delivered_count=len(delivered),
        total_revenue=round(total_revenue, 2),
        avg_ticket=round(avg_ticket, 2),
        occupied_tables=sum(1 for t in TABLES if t.status == TableStatus.occupied),
        available_tables=sum(1 for t in TABLES if t.status == TableStatus.available),
    )


# ─── Health check ─────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
async def health_check():
    """Confirm the API is running."""
    return {
        "status": "ok",
        "service": "Beacon API",
        "version": "1.0.0",
    }
