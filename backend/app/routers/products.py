import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth.security import get_current_user, require_role
from app.database import (
    categories_table,
    products_table,
    platform_prices_table,
    vendors_table,
    Query_,
)
from app.models.schemas import (
    CategoryCreate,
    CategoryResponse,
    ProductCreate,
    ProductResponse,
    PlatformPriceCreate,
    PlatformPriceResponse,
    CompareResponse,
    UserRole,
)

router = APIRouter(prefix="/products", tags=["Products"])


def _enrich_product(product: dict) -> ProductResponse:
    cat = categories_table.get(Query_.id == product["category_id"])
    vendor = vendors_table.get(Query_.id == product["vendor_id"])
    return ProductResponse(
        id=product["id"],
        name=product["name"],
        description=product["description"],
        price=product["price"],
        category_id=product["category_id"],
        category_name=cat["name"] if cat else "",
        vendor_id=product["vendor_id"],
        vendor_name=vendor["business_name"] if vendor else "",
        image_url=product.get("image_url", ""),
        stock=product.get("stock", 0),
        created_at=product["created_at"],
    )


@router.get("/categories", response_model=list[CategoryResponse])
def list_categories():
    return [
        CategoryResponse(
            id=c["id"], name=c["name"], description=c.get("description", ""), image_url=c.get("image_url", "")
        )
        for c in categories_table.all()
    ]


@router.post("/categories", response_model=CategoryResponse)
def create_category(data: CategoryCreate, admin: dict = Depends(require_role(UserRole.ADMIN))):
    cat = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "description": data.description,
        "image_url": data.image_url,
    }
    categories_table.insert(cat)
    return CategoryResponse(**cat)


@router.get("", response_model=list[ProductResponse])
def list_products(
    category_id: str | None = Query(None),
    search: str | None = Query(None),
    vendor_id: str | None = Query(None),
):
    products = products_table.all()
    if category_id:
        products = [p for p in products if p["category_id"] == category_id]
    if vendor_id:
        products = [p for p in products if p["vendor_id"] == vendor_id]
    if search:
        search_lower = search.lower()
        products = [p for p in products if search_lower in p["name"].lower()]
    return [_enrich_product(p) for p in products]


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: str):
    product = products_table.get(Query_.id == product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return _enrich_product(product)


@router.post("", response_model=ProductResponse)
def create_product(data: ProductCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in [UserRole.ADMIN.value, UserRole.VENDOR.value]:
        raise HTTPException(status_code=403, detail="Only vendors and admins can add products")
    product = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "description": data.description,
        "price": data.price,
        "category_id": data.category_id,
        "vendor_id": data.vendor_id,
        "image_url": data.image_url,
        "stock": data.stock,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    products_table.insert(product)
    return _enrich_product(product)


@router.post("/platform-prices", response_model=PlatformPriceResponse)
def add_platform_price(data: PlatformPriceCreate, admin: dict = Depends(require_role(UserRole.ADMIN))):
    pp = {
        "id": str(uuid.uuid4()),
        "product_id": data.product_id,
        "platform_name": data.platform_name,
        "price": data.price,
        "url": data.url,
    }
    platform_prices_table.insert(pp)
    return PlatformPriceResponse(**pp)


@router.get("/{product_id}/compare", response_model=CompareResponse)
def compare_prices(product_id: str):
    product = products_table.get(Query_.id == product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    prices = platform_prices_table.search(Query_.product_id == product_id)
    platform_prices = [PlatformPriceResponse(**pp) for pp in prices]
    all_prices = [{"price": product["price"], "platform": "Our Store", "id": None}] + [
        {"price": pp.price, "platform": pp.platform_name, "id": pp.id} for pp in platform_prices
    ]
    best = min(all_prices, key=lambda x: x["price"])
    savings = max(p["price"] for p in all_prices) - best["price"]
    best_deal = None
    if best["id"]:
        best_deal = next(pp for pp in platform_prices if pp.id == best["id"])
    elif best["platform"] == "Our Store":
        best_deal = PlatformPriceResponse(
            id="store", product_id=product_id, platform_name="Our Store", price=product["price"], url=""
        )
    return CompareResponse(
        product=_enrich_product(product),
        platform_prices=platform_prices,
        best_deal=best_deal,
        savings=round(savings, 2),
    )
