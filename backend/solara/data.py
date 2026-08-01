"""
Solara Real Estate Platform — In-Memory Data Store
"""

from models import Property, PropertyType

PROPERTIES: list[Property] = [
    Property(id=1,  type=PropertyType.house,    title="The Oakwood",           address="2847 Peachtree Rd NE",  city="Buckhead, GA",        price=1250000, beds=5, baths=4.5, sqft=4200, lot="0.4 ac", built=2019, photos=8,  rating=4.9, agent="Maya Chen",    featured=True,  tags=["Pool", "Smart Home", "Chef's Kitchen"], color="#F59E0B", bg="#FFFBEB"),
    Property(id=2,  type=PropertyType.condo,    title="Midtown Heights",        address="1010 West Peachtree",  city="Midtown, GA",         price=485000,  beds=2, baths=2.0, sqft=1280, lot=None,      built=2021, photos=12, rating=4.7, agent="Zara Williams", featured=False, tags=["City Views", "Rooftop", "Concierge"],  color="#F97316", bg="#FFF7ED"),
    Property(id=3,  type=PropertyType.townhome, title="Brookhaven Row",         address="3420 Dresden Dr",      city="Brookhaven, GA",      price=720000,  beds=3, baths=3.5, sqft=2400, lot="0.1 ac", built=2020, photos=9,  rating=4.8, agent="Sofia Reyes",  featured=False, tags=["End Unit", "Garage", "Private Patio"], color="#EF4444", bg="#FEF2F2"),
    Property(id=4,  type=PropertyType.house,    title="Sandy Springs Reserve",  address="512 Abernathy Rd",     city="Sandy Springs, GA",   price=890000,  beds=4, baths=3.0, sqft=3100, lot="0.3 ac", built=2017, photos=14, rating=4.6, agent="Maya Chen",    featured=False, tags=["Corner Lot", "Renovated", "3-Car Garage"], color="#8B5CF6", bg="#F5F3FF"),
    Property(id=5,  type=PropertyType.condo,    title="Ponce City Loft",        address="675 Ponce De Leon",    city="Old Fourth Ward, GA", price=390000,  beds=1, baths=1.0, sqft=890,  lot=None,      built=2018, photos=7,  rating=4.5, agent="Zara Williams", featured=False, tags=["Industrial", "High Ceilings", "Market Below"], color="#10B981", bg="#F0FDF4"),
    Property(id=6,  type=PropertyType.house,    title="Druid Hills Estate",     address="1204 Ponce De Leon",   city="Druid Hills, GA",     price=2100000, beds=6, baths=5.0, sqft=6800, lot="1.2 ac", built=1932, photos=22, rating=5.0, agent="Sofia Reyes",  featured=True,  tags=["Historic", "Pool House", "Guest Suite"], color="#F59E0B", bg="#FFFBEB"),
]

# Track saved properties per session (in production: per user in DB)
SAVED_PROPERTY_IDS: set[int] = {1, 6}
