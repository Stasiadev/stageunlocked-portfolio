from models import MenuItem, Table, Order, OrderItem, TableStatus, OrderStatus

# ─── In-memory store ──────────────────────────────────────────────────────────
# In production this would be a PostgreSQL database.
# For demo purposes, state is held in memory and resets on server restart.

MENU_ITEMS: list[MenuItem] = [
    MenuItem(id=1,  cat="Starters",  name="Truffle Arancini",        price=16, prep=12, emoji="🍙", popular=True),
    MenuItem(id=2,  cat="Starters",  name="Heirloom Tomato Salad",   price=14, prep=8,  emoji="🥗", popular=False),
    MenuItem(id=3,  cat="Starters",  name="Burrata & Prosciutto",    price=18, prep=6,  emoji="🧀", popular=True),
    MenuItem(id=4,  cat="Mains",     name="Duck Breast Confit",      price=38, prep=22, emoji="🦆", popular=True),
    MenuItem(id=5,  cat="Mains",     name="Pan-Seared Sea Bass",     price=34, prep=18, emoji="🐟", popular=False),
    MenuItem(id=6,  cat="Mains",     name="Grass-Fed Ribeye 12oz",   price=52, prep=24, emoji="🥩", popular=True),
    MenuItem(id=7,  cat="Mains",     name="Wild Mushroom Risotto",   price=28, prep=20, emoji="🍄", popular=False),
    MenuItem(id=8,  cat="Desserts",  name="Valrhona Chocolate Tart", price=12, prep=5,  emoji="🍫", popular=True),
    MenuItem(id=9,  cat="Desserts",  name="Seasonal Sorbet",         price=9,  prep=3,  emoji="🍧", popular=False),
    MenuItem(id=10, cat="Drinks",    name="Craft Cocktail",          price=14, prep=4,  emoji="🍸", popular=False),
]

TABLES: list[Table] = [
    Table(id=1,  seats=2, status=TableStatus.available),
    Table(id=2,  seats=4, status=TableStatus.occupied,  guests=3, server="Maya",  elapsed=42),
    Table(id=3,  seats=4, status=TableStatus.occupied,  guests=4, server="Leo",   elapsed=18),
    Table(id=4,  seats=6, status=TableStatus.reserved,  time="7:30 PM", name="Johnson"),
    Table(id=5,  seats=2, status=TableStatus.available),
    Table(id=6,  seats=8, status=TableStatus.occupied,  guests=7, server="Priya", elapsed=61),
    Table(id=7,  seats=4, status=TableStatus.available),
    Table(id=8,  seats=2, status=TableStatus.cleaning),
    Table(id=9,  seats=4, status=TableStatus.occupied,  guests=2, server="Maya",  elapsed=9),
    Table(id=10, seats=6, status=TableStatus.reserved,  time="8:00 PM", name="Williams"),
    Table(id=11, seats=2, status=TableStatus.available),
    Table(id=12, seats=4, status=TableStatus.occupied,  guests=4, server="Leo",   elapsed=33),
]

ORDERS: list[Order] = [
    Order(id="ORD-001", table=2,  status=OrderStatus.ready,     items=[OrderItem(name="Duck Breast Confit", qty=1), OrderItem(name="Pan-Seared Sea Bass", qty=1), OrderItem(name="Truffle Arancini", qty=2)], total=102, time=38, server="Maya"),
    Order(id="ORD-002", table=3,  status=OrderStatus.cooking,   items=[OrderItem(name="Grass-Fed Ribeye 12oz", qty=2), OrderItem(name="Heirloom Tomato Salad", qty=1)], total=118, time=14, server="Leo"),
    Order(id="ORD-003", table=6,  status=OrderStatus.pending,   items=[OrderItem(name="Wild Mushroom Risotto", qty=3), OrderItem(name="Burrata & Prosciutto", qty=2), OrderItem(name="Craft Cocktail", qty=6)], total=172, time=2, server="Priya"),
    Order(id="ORD-004", table=9,  status=OrderStatus.cooking,   items=[OrderItem(name="Truffle Arancini", qty=1), OrderItem(name="Duck Breast Confit", qty=2)], total=92, time=9, server="Maya"),
    Order(id="ORD-005", table=12, status=OrderStatus.pending,   items=[OrderItem(name="Valrhona Chocolate Tart", qty=2), OrderItem(name="Seasonal Sorbet", qty=2)], total=42, time=1, server="Leo"),
]

ORDER_STATUSES = [s.value for s in OrderStatus]
