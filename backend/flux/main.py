"""
Flux — E-Commerce Checkout Platform
FastAPI Backend

Endpoints:
  GET    /api/products                — All products (filterable)
  GET    /api/products/{id}           — Single product
  GET    /api/cart                    — Current cart with totals
  POST   /api/cart                    — Add item to cart
  PATCH  /api/cart/{product_id}       — Update item quantity
  DELETE /api/cart/{product_id}       — Remove item from cart
  DELETE /api/cart                    — Clear entire cart
  POST   /api/orders                  — Place order (checkout)
  GET    /api/orders/{id}             — Get order by ID

Run locally:
  pip install -r requirements.txt
  uvicorn main:app --reload --port 8003

Docs at: http://localhost:8003/docs
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import uuid

from models import (
    Product, Category,
    CartItem, CartSummary,
    AddToCartRequest, UpdateCartRequest,
    PlaceOrderRequest, Order, OrderStatus,
    ShippingInfo,
)
from data import PRODUCTS, CART, ORDERS, get_next_order_id

app = FastAPI(
    title="Flux E-Commerce API",
    description="E-commerce checkout backend for Flux by Stage Labs",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Constants ────────────────────────────────────────────────────────────────

SHIPPING_THRESHOLD = 50.00   # Free shipping above this amount
SHIPPING_COST = 6.99
TAX_RATE = 0.08              # 8% tax rate


# ─── Helper functions ─────────────────────────────────────────────────────────

def get_product_by_id(product_id: int) -> Product:
    """Fetch a product or raise 404."""
    product = next((p for p in PRODUCTS if p.id == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
    return product


def build_cart_summary() -> CartSummary:
    """Compute the full cart with totals from current CART state."""
    items: list[CartItem] = []
    subtotal = 0.0

    for product_id, quantity in CART.items():
        product = next((p for p in PRODUCTS if p.id == product_id), None)
        if product:
            items.append(CartItem(product_id=product_id, quantity=quantity, product=product))
            subtotal += product.price * quantity

    shipping = 0.0 if subtotal >= SHIPPING_THRESHOLD else SHIPPING_COST
    tax = round(subtotal * TAX_RATE, 2)
    total = round(subtotal + shipping + tax, 2)

    return CartSummary(
        items=items,
        subtotal=round(subtotal, 2),
        shipping=shipping,
        tax=tax,
        total=total,
        item_count=sum(CART.values()),
    )


# ─── Product endpoints ────────────────────────────────────────────────────────

@app.get("/api/products", response_model=list[Product], tags=["Products"])
async def get_products(
    category: Optional[Category] = Query(None, description="Filter by category"),
    in_stock: Optional[bool] = Query(None, description="Filter by stock availability"),
    search: Optional[str] = Query(None, description="Search by name or brand"),
):
    """
    Return all products.
    Supports filtering by category, stock status, and name/brand search.
    """
    results = PRODUCTS.copy()

    if category:
        results = [p for p in results if p.category == category]

    if in_stock is not None:
        results = [p for p in results if p.in_stock == in_stock]

    if search:
        query = search.lower()
        results = [
            p for p in results
            if query in p.name.lower() or query in p.brand.lower()
        ]

    return results


@app.get("/api/products/{product_id}", response_model=Product, tags=["Products"])
async def get_product(product_id: int):
    """Return a single product by ID."""
    return get_product_by_id(product_id)


# ─── Cart endpoints ───────────────────────────────────────────────────────────

@app.get("/api/cart", response_model=CartSummary, tags=["Cart"])
async def get_cart():
    """Return current cart contents with computed subtotal, shipping, tax, and total."""
    return build_cart_summary()


@app.post("/api/cart", response_model=CartSummary, status_code=201, tags=["Cart"])
async def add_to_cart(body: AddToCartRequest):
    """
    Add a product to the cart.
    If the product is already in the cart, the quantity is incremented.
    """
    product = get_product_by_id(body.product_id)

    if not product.in_stock:
        raise HTTPException(
            status_code=400,
            detail=f"'{product.name}' is currently out of stock"
        )

    CART[body.product_id] = CART.get(body.product_id, 0) + body.quantity
    return build_cart_summary()


@app.patch("/api/cart/{product_id}", response_model=CartSummary, tags=["Cart"])
async def update_cart_item(product_id: int, body: UpdateCartRequest):
    """
    Update the quantity of a cart item.
    Setting quantity to 0 removes the item from the cart.
    """
    if product_id not in CART:
        raise HTTPException(
            status_code=404,
            detail=f"Product {product_id} is not in the cart"
        )

    if body.quantity == 0:
        del CART[product_id]
    else:
        CART[product_id] = body.quantity

    return build_cart_summary()


@app.delete("/api/cart/{product_id}", response_model=CartSummary, tags=["Cart"])
async def remove_from_cart(product_id: int):
    """Remove a specific product from the cart."""
    if product_id not in CART:
        raise HTTPException(
            status_code=404,
            detail=f"Product {product_id} is not in the cart"
        )

    del CART[product_id]
    return build_cart_summary()


@app.delete("/api/cart", tags=["Cart"])
async def clear_cart():
    """Remove all items from the cart."""
    CART.clear()
    return {"message": "Cart cleared", "item_count": 0}


# ─── Order endpoints ──────────────────────────────────────────────────────────

@app.post("/api/orders", response_model=Order, status_code=201, tags=["Orders"])
async def place_order(body: PlaceOrderRequest):
    """
    Place an order with the current cart contents.
    Validates cart is not empty, processes payment simulation,
    clears cart on success, and returns order confirmation.
    """
    if not CART:
        raise HTTPException(
            status_code=400,
            detail="Cannot place an order with an empty cart"
        )

    # Build current cart snapshot for the order
    cart = build_cart_summary()

    # In production: process payment through Stripe or similar
    # Here we simulate payment success
    order_id = get_next_order_id()

    order = Order(
        id=order_id,
        status=OrderStatus.confirmed,
        items=cart.items,
        shipping=body.shipping,
        subtotal=cart.subtotal,
        shipping_cost=cart.shipping,
        tax=cart.tax,
        total=cart.total,
    )

    ORDERS.append(order.model_dump())

    # Clear cart after successful order
    CART.clear()

    return order


@app.get("/api/orders/{order_id}", response_model=Order, tags=["Orders"])
async def get_order(order_id: str):
    """Return a single order by ID."""
    order_data = next((o for o in ORDERS if o["id"] == order_id), None)
    if not order_data:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    return Order(**order_data)


# ─── Health check ─────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok", "service": "Flux E-Commerce API", "version": "1.0.0"}
