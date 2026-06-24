import uuid
from datetime import datetime, timezone

from app.auth.security import hash_password
from app.database import (
    users_table,
    categories_table,
    products_table,
    platform_prices_table,
    vendors_table,
    Query_,
)


def seed_database():
    if users_table.get(Query_.email == "admin@marketplace.com"):
        return

    admin_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    vendor_user_id = str(uuid.uuid4())

    users_table.insert_multiple([
        {
            "id": admin_id,
            "email": "admin@marketplace.com",
            "password": hash_password("admin123"),
            "full_name": "Admin User",
            "role": "admin",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
        {
            "id": user_id,
            "email": "user@marketplace.com",
            "password": hash_password("user123"),
            "full_name": "John Doe",
            "role": "user",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
        {
            "id": vendor_user_id,
            "email": "vendor@marketplace.com",
            "password": hash_password("vendor123"),
            "full_name": "Tech Vendor",
            "role": "vendor",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
    ])

    categories = [
        {"id": str(uuid.uuid4()), "name": "Electronics", "description": "Gadgets and devices", "image_url": "https://picsum.photos/seed/electronics/400/300"},
        {"id": str(uuid.uuid4()), "name": "Fashion", "description": "Clothing and accessories", "image_url": "https://picsum.photos/seed/fashion/400/300"},
        {"id": str(uuid.uuid4()), "name": "Home & Kitchen", "description": "Home essentials", "image_url": "https://picsum.photos/seed/home/400/300"},
        {"id": str(uuid.uuid4()), "name": "Books", "description": "Books and stationery", "image_url": "https://picsum.photos/seed/books/400/300"},
    ]
    categories_table.insert_multiple(categories)

    vendor_id = str(uuid.uuid4())
    vendors_table.insert({
        "id": vendor_id,
        "user_id": vendor_user_id,
        "business_name": "TechZone Electronics",
        "description": "Premium electronics vendor",
        "contact_email": "vendor@marketplace.com",
        "contact_phone": "+91-9876543210",
        "address": "123 Tech Park, Bangalore",
        "is_approved": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    products_data = [
        ("Wireless Headphones", "Premium noise-cancelling headphones", 2999, categories[0]["id"], 4999),
        ("Smart Watch Pro", "Fitness tracking smartwatch", 8999, categories[0]["id"], 12999),
        ("Running Shoes", "Lightweight running shoes", 3499, categories[1]["id"], 4999),
        ("Coffee Maker", "Automatic drip coffee maker", 4599, categories[2]["id"], 5999),
        ("Python Programming Book", "Learn Python the hard way", 599, categories[3]["id"], 799),
        ("Bluetooth Speaker", "Portable waterproof speaker", 1999, categories[0]["id"], 2999),
        ("Leather Wallet", "Genuine leather bifold wallet", 1299, categories[1]["id"], 1899),
        ("Air Fryer", "Digital air fryer 5L capacity", 5999, categories[2]["id"], 7999),
    ]

    for name, desc, price, cat_id, competitor_price in products_data:
        pid = str(uuid.uuid4())
        products_table.insert({
            "id": pid,
            "name": name,
            "description": desc,
            "price": price,
            "category_id": cat_id,
            "vendor_id": vendor_id,
            "image_url": f"https://picsum.photos/seed/{name.replace(' ', '')}/400/400",
            "stock": 50,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        platform_prices_table.insert_multiple([
            {"id": str(uuid.uuid4()), "product_id": pid, "platform_name": "Amazon", "price": competitor_price, "url": "https://amazon.in"},
            {"id": str(uuid.uuid4()), "product_id": pid, "platform_name": "Flipkart", "price": round(competitor_price * 0.95, 2), "url": "https://flipkart.com"},
            {"id": str(uuid.uuid4()), "product_id": pid, "platform_name": "Meesho", "price": round(competitor_price * 0.85, 2), "url": "https://meesho.com"},
        ])

    print("Database seeded successfully!")
    print("  Admin: admin@marketplace.com / admin123")
    print("  User:  user@marketplace.com / user123")
    print("  Vendor: vendor@marketplace.com / vendor123")
