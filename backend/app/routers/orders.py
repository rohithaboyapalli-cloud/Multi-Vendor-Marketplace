import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.auth.security import get_current_user, require_role
from app.database import (
    orders_table,
    addresses_table,
    products_table,
    cart_table,
    Query_,
)
from app.models.schemas import (
    OrderCreate,
    OrderResponse,
    OrderItemResponse,
    OrderStatusUpdate,
    OrderStatus,
    PaymentStatus,
    AddressResponse,
    UserRole,
)

router = APIRouter(prefix="/orders", tags=["Orders"])


def _build_order_response(order: dict) -> OrderResponse:
    addr = addresses_table.get(Query_.id == order["address_id"])
    return OrderResponse(
        id=order["id"],
        user_id=order["user_id"],
        address=AddressResponse(**addr) if addr else None,
        items=[OrderItemResponse(**i) for i in order["items"]],
        subtotal=order["subtotal"],
        tax=order["tax"],
        total=order["total"],
        status=order["status"],
        payment_method=order["payment_method"],
        payment_status=order["payment_status"],
        tracking_number=order.get("tracking_number", ""),
        created_at=order["created_at"],
        updated_at=order["updated_at"],
    )


@router.post("", response_model=OrderResponse)
def create_order(data: OrderCreate, user: dict = Depends(get_current_user)):
    addr = addresses_table.get(
        (Query_.id == data.address_id) & (Query_.user_id == user["id"])
    )
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")

    items = []
    subtotal = 0.0
    for item in data.items:
        product = products_table.get(Query_.id == item.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product.get("stock", 0) < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['name']}")
        line_total = product["price"] * item.quantity
        subtotal += line_total
        items.append({
            "product_id": item.product_id,
            "product_name": product["name"],
            "quantity": item.quantity,
            "unit_price": product["price"],
            "total_price": line_total,
        })
        products_table.update(
            {"stock": product["stock"] - item.quantity}, Query_.id == product["id"]
        )

    tax = round(subtotal * 0.18, 2)
    now = datetime.now(timezone.utc).isoformat()
    order = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "address_id": data.address_id,
        "items": items,
        "subtotal": subtotal,
        "tax": tax,
        "total": round(subtotal + tax, 2),
        "status": OrderStatus.PENDING.value,
        "payment_method": data.payment_method.value,
        "payment_status": PaymentStatus.PENDING.value,
        "tracking_number": "",
        "created_at": now,
        "updated_at": now,
    }
    orders_table.insert(order)
    cart_table.remove(Query_.user_id == user["id"])
    return _build_order_response(order)


@router.get("", response_model=list[OrderResponse])
def list_orders(user: dict = Depends(get_current_user)):
    if user["role"] == UserRole.ADMIN.value:
        orders = orders_table.all()
    else:
        orders = orders_table.search(Query_.user_id == user["id"])
    return [_build_order_response(o) for o in sorted(orders, key=lambda x: x["created_at"], reverse=True)]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = orders_table.get(Query_.id == order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if user["role"] != UserRole.ADMIN.value and order["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return _build_order_response(order)


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: str,
    data: OrderStatusUpdate,
    admin: dict = Depends(require_role(UserRole.ADMIN, UserRole.VENDOR)),
):
    order = orders_table.get(Query_.id == order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    updates = {"status": data.status.value, "updated_at": datetime.now(timezone.utc).isoformat()}
    if data.tracking_number:
        updates["tracking_number"] = data.tracking_number
    orders_table.update(updates, Query_.id == order_id)
    return _build_order_response(orders_table.get(Query_.id == order_id))


@router.get("/{order_id}/track")
def track_order(order_id: str, user: dict = Depends(get_current_user)):
    order = orders_table.get(Query_.id == order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if user["role"] != UserRole.ADMIN.value and order["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    status_flow = [
        OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING,
        OrderStatus.SHIPPED, OrderStatus.DELIVERED,
    ]
    current_idx = next(
        (i for i, s in enumerate(status_flow) if s.value == order["status"]), 0
    )
    timeline = []
    for i, status in enumerate(status_flow):
        timeline.append({
            "status": status.value,
            "completed": i <= current_idx,
            "active": i == current_idx,
        })
    return {
        "order_id": order_id,
        "current_status": order["status"],
        "tracking_number": order.get("tracking_number", ""),
        "timeline": timeline,
    }
