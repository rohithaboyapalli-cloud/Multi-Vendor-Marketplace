import os
from tinydb import TinyDB, Query
from tinydb.storages import JSONStorage
from tinydb.middlewares import CachingMiddleware

from app.config import settings


def get_db() -> TinyDB:
    os.makedirs(os.path.dirname(settings.db_path) or ".", exist_ok=True)
    return TinyDB(settings.db_path, storage=CachingMiddleware(JSONStorage))


db = get_db()

# Tables
users_table = db.table("users")
categories_table = db.table("categories")
products_table = db.table("products")
platform_prices_table = db.table("platform_prices")
vendors_table = db.table("vendors")
addresses_table = db.table("addresses")
cart_table = db.table("cart")
wishlist_table = db.table("wishlist")
orders_table = db.table("orders")
payments_table = db.table("payments")

Query_ = Query()
