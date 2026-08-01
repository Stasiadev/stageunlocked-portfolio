"""
Flux E-Commerce Platform — Pydantic Models
"""

from pydantic import BaseModel, field_validator
from typing import Optional
from enum import Enum


class Category(str, Enum):
    foundation = "Foundation"
    concealer = "Concealer"
    blush = "Blush"
    highlight = "Highlight"
    lip = "Lip"
    eye = "Eye"
    skincare = "Skincare"


class OrderStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    shipped = "shipped"
    delivered = "delivered"


# ─── Product models ───────────────────────────────────────────────────────────

class Product(BaseModel):
    id: int
    name: str
    brand: str
    category: Category
    price: float
    shade: Optional[str] = None
    description: str
    rating: float
    review_count: int
    in_stock: bool
    image_color: str


# ─── Cart models ──────────────────────────────────────────────────────────────

class CartItem(BaseModel):
    product_id: int
    quantity: int
    product: Optional[Product] = None


class AddToCartRequest(BaseModel):
    product_id: int
    quantity: int = 1

    @field_validator("quantity")
    @classmethod
    def quantity_must_be_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v


class UpdateCartRequest(BaseModel):
    quantity: int

    @field_validator("quantity")
    @classmethod
    def quantity_must_be_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Quantity cannot be negative")
        return v


class CartSummary(BaseModel):
    items: list[CartItem]
    subtotal: float
    shipping: float
    tax: float
    total: float
    item_count: int


# ─── Checkout models ──────────────────────────────────────────────────────────

class ShippingInfo(BaseModel):
    first_name: str
    last_name: str
    email: str
    address: str
    city: str
    state: str
    zip_code: str

    @field_validator("zip_code")
    @classmethod
    def zip_must_be_five_digits(cls, v: str) -> str:
        cleaned = v.strip().replace("-", "")[:5]
        if not cleaned.isdigit() or len(cleaned) != 5:
            raise ValueError("ZIP code must be 5 digits")
        return cleaned

    @field_validator("email")
    @classmethod
    def email_must_be_valid(cls, v: str) -> str:
        if "@" not in v or "." not in v:
            raise ValueError("Invalid email address")
        return v.lower()


class PaymentInfo(BaseModel):
    card_number: str
    expiry: str
    cvv: str
    name_on_card: str

    @field_validator("card_number")
    @classmethod
    def card_must_be_valid_length(cls, v: str) -> str:
        digits = v.replace(" ", "").replace("-", "")
        if not digits.isdigit() or len(digits) not in (15, 16):
            raise ValueError("Card number must be 15 or 16 digits")
        return digits

    @field_validator("cvv")
    @classmethod
    def cvv_must_be_valid(cls, v: str) -> str:
        if not v.isdigit() or len(v) not in (3, 4):
            raise ValueError("CVV must be 3 or 4 digits")
        return v


class PlaceOrderRequest(BaseModel):
    shipping: ShippingInfo
    payment: PaymentInfo


# ─── Order models ─────────────────────────────────────────────────────────────

class Order(BaseModel):
    id: str
    status: OrderStatus
    items: list[CartItem]
    shipping: ShippingInfo
    subtotal: float
    shipping_cost: float
    tax: float
    total: float
