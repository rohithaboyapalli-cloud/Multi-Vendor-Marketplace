from collections import defaultdict
from datetime import datetime

from fastapi import APIRouter, Depends

from app.auth.security import require_role
from app.database import (
    users_table,
    vendors_table,
    products_table,
    orders_table,
    Query_,
)
from app.models.schemas import AnalyticsResponse, UserRole, PaymentStatus
from app.routers.orders import _build_order_response

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("", response_model=AnalyticsResponse)
def get_analytics(admin: dict = Depends(require_role(UserRole.ADMIN))):
    users = users_table.all()
    vendors = vendors_table.all()
    products = products_table.all()
    orders = orders_table.all()

    total_revenue = sum(
        o["total"] for o in orders if o.get("payment_status") == PaymentStatus.COMPLETED.value
    )

    orders_by_status: dict[str, int] = defaultdict(int)
    for o in orders:
        orders_by_status[o["status"]] += 1

    revenue_by_month: dict[str, float] = defaultdict(float)
    for o in orders:
        if o.get("payment_status") == PaymentStatus.COMPLETED.value:
            month = o["created_at"][:7]
            revenue_by_month[month] += o["total"]

    product_sales: dict[str, dict] = defaultdict(lambda: {"name": "", "quantity": 0, "revenue": 0})
    for o in orders:
        for item in o.get("items", []):
            pid = item["product_id"]
            product_sales[pid]["name"] = item["product_name"]
            product_sales[pid]["quantity"] += item["quantity"]
            product_sales[pid]["revenue"] += item["total_price"]

    top_products = sorted(
        [{"product_id": k, **v} for k, v in product_sales.items()],
        key=lambda x: x["revenue"],
        reverse=True,
    )[:10]

    recent = sorted(orders, key=lambda x: x["created_at"], reverse=True)[:10]

    return AnalyticsResponse(
        total_users=len(users),
        total_vendors=len(vendors),
        total_products=len(products),
        total_orders=len(orders),
        total_revenue=round(total_revenue, 2),
        orders_by_status=dict(orders_by_status),
        revenue_by_month=[
            {"month": m, "revenue": round(r, 2)}
            for m, r in sorted(revenue_by_month.items())
        ],
        top_products=top_products,
        recent_orders=[_build_order_response(o) for o in recent],
    )
