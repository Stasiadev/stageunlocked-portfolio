"""
Flux E-Commerce Platform — In-Memory Data Store
"""

from models import Product, Category

PRODUCTS: list[Product] = [
    Product(id=1,  name="Pro Filt'r Soft Matte Foundation", brand="Fenty Beauty",       category=Category.foundation, price=38.00, shade="330W",        description="Full-coverage, long-wear matte foundation for all skin types.", rating=4.8, review_count=12400, in_stock=True,  image_color="#D4A574"),
    Product(id=2,  name="Studio Fix Fluid Foundation",       brand="MAC",                category=Category.foundation, price=38.00, shade="NC42",         description="Medium-buildable coverage with a natural matte finish.",        rating=4.7, review_count=8900,  in_stock=True,  image_color="#C8956C"),
    Product(id=3,  name="Natural Radiant Longwear Foundation",brand="NARS",              category=Category.foundation, price=50.00, shade="Syracuse",      description="Radiant, skin-like finish with buildable medium coverage.",      rating=4.6, review_count=6700,  in_stock=True,  image_color="#BA8860"),
    Product(id=4,  name="Radiant Creamy Concealer",          brand="NARS",               category=Category.concealer,  price=32.00, shade="Caramel",       description="Creamy, full-coverage concealer with a radiant finish.",        rating=4.9, review_count=15200, in_stock=True,  image_color="#C9956A"),
    Product(id=5,  name="Shape Tape Concealer",               brand="Tarte",              category=Category.concealer,  price=30.00, shade="38N Medium Tan",description="Full-coverage concealer that tapes away imperfections.",        rating=4.7, review_count=11000, in_stock=True,  image_color="#C48B5F"),
    Product(id=6,  name="Cheeks Out Freestyle Cream Blush",  brand="Fenty Beauty",       category=Category.blush,      price=24.00, shade="Fuego",         description="Creamy, blendable blush in a warm coral-red.",                 rating=4.8, review_count=7800,  in_stock=True,  image_color="#E8715A"),
    Product(id=7,  name="Blusher in Melba",                  brand="NARS",               category=Category.blush,      price=30.00, shade="Melba",         description="Buildable powder blush in a peachy nude.",                     rating=4.6, review_count=9200,  in_stock=True,  image_color="#E8A898"),
    Product(id=8,  name="Trophy Wife Highlighter",           brand="Fenty Beauty",        category=Category.highlight,  price=38.00, shade="Trophy Wife",   description="Blinding gold highlighter for a glass-skin finish.",           rating=4.9, review_count=18600, in_stock=True,  image_color="#F5C842"),
    Product(id=9,  name="Chestnut Lip Liner",                brand="MAC",                 category=Category.lip,        price=22.00, shade="Chestnut",      description="Classic warm brown lip liner for a defined, full look.",        rating=4.8, review_count=22100, in_stock=True,  image_color="#8B4A2B"),
    Product(id=10, name="Velvet Teddy Lipstick",             brand="MAC",                 category=Category.lip,        price=22.00, shade="Velvet Teddy",  description="Matte pinkish-beige lipstick — the ultimate nude.",            rating=4.9, review_count=31400, in_stock=True,  image_color="#C4836A"),
]

# In-memory cart: product_id → quantity
CART: dict[int, int] = {}

# Orders store
ORDERS: list[dict] = []

# Order counter
_order_counter: int = 1000

def get_next_order_id() -> str:
    global _order_counter
    _order_counter += 1
    return f"FLX-{_order_counter}"
