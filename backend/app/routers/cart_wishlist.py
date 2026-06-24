import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth.security import get_current_user
from app.database import cart_table, wishlist_table, products_table, Query_
from app.models.schemas import CartItemCreate, CartItemResponse, WishlistItemResponse
from app.routers.products import _enrich_product

router = APIRouter(tags=["Cart & Wishlist"])


@router.get("/cart", response_model=list[CartItemResponse])
def get_cart(user: dict = Depends(get_current_user)):
    items = cart_table.search(Query_.user_id == user["id"])
    result = []
    for item in items:
        product = products_table.get(Query_.id == item["product_id"])
        result.append(
            CartItemResponse(
                id=item["id"],
                product_id=item["product_id"],
                product=_enrich_product(product) if product else None,
                quantity=item["quantity"],
            )
        )
    return result


@router.post("/cart", response_model=CartItemResponse)
def add_to_cart(data: CartItemCreate, user: dict = Depends(get_current_user)):
    product = products_table.get(Query_.id == data.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    existing = cart_table.get(
        (Query_.user_id == user["id"]) & (Query_.product_id == data.product_id)
    )
    if existing:
        new_qty = existing["quantity"] + data.quantity
        cart_table.update({"quantity": new_qty}, Query_.id == existing["id"])
        item = cart_table.get(Query_.id == existing["id"])
    else:
        item = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "product_id": data.product_id,
            "quantity": data.quantity,
        }
        cart_table.insert(item)
    return CartItemResponse(
        id=item["id"],
        product_id=item["product_id"],
        product=_enrich_product(product),
        quantity=item["quantity"],
    )


@router.patch("/cart/{item_id}", response_model=CartItemResponse)
def update_cart_item(item_id: str, quantity: int = Query(..., ge=0), user: dict = Depends(get_current_user)):
    item = cart_table.get((Query_.id == item_id) & (Query_.user_id == user["id"]))
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    if quantity <= 0:
        cart_table.remove(Query_.id == item_id)
        raise HTTPException(status_code=200, detail="Item removed")
    cart_table.update({"quantity": quantity}, Query_.id == item_id)
    item = cart_table.get(Query_.id == item_id)
    product = products_table.get(Query_.id == item["product_id"])
    return CartItemResponse(
        id=item["id"], product_id=item["product_id"],
        product=_enrich_product(product) if product else None, quantity=item["quantity"],
    )


@router.delete("/cart/{item_id}")
def remove_from_cart(item_id: str, user: dict = Depends(get_current_user)):
    item = cart_table.get((Query_.id == item_id) & (Query_.user_id == user["id"]))
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    cart_table.remove(Query_.id == item_id)
    return {"message": "Removed from cart"}


@router.delete("/cart")
def clear_cart(user: dict = Depends(get_current_user)):
    cart_table.remove(Query_.user_id == user["id"])
    return {"message": "Cart cleared"}


@router.get("/wishlist", response_model=list[WishlistItemResponse])
def get_wishlist(user: dict = Depends(get_current_user)):
    items = wishlist_table.search(Query_.user_id == user["id"])
    result = []
    for item in items:
        product = products_table.get(Query_.id == item["product_id"])
        result.append(
            WishlistItemResponse(
                id=item["id"],
                product_id=item["product_id"],
                product=_enrich_product(product) if product else None,
                added_at=item["added_at"],
            )
        )
    return result


@router.post("/wishlist/{product_id}", response_model=WishlistItemResponse)
def add_to_wishlist(product_id: str, user: dict = Depends(get_current_user)):
    product = products_table.get(Query_.id == product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    existing = wishlist_table.get(
        (Query_.user_id == user["id"]) & (Query_.product_id == product_id)
    )
    if existing:
        return WishlistItemResponse(
            id=existing["id"], product_id=product_id,
            product=_enrich_product(product), added_at=existing["added_at"],
        )
    item = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "product_id": product_id,
        "added_at": datetime.now(timezone.utc).isoformat(),
    }
    wishlist_table.insert(item)
    return WishlistItemResponse(
        id=item["id"], product_id=product_id,
        product=_enrich_product(product), added_at=item["added_at"],
    )


@router.delete("/wishlist/{product_id}")
def remove_from_wishlist(product_id: str, user: dict = Depends(get_current_user)):
    item = wishlist_table.get(
        (Query_.user_id == user["id"]) & (Query_.product_id == product_id)
    )
    if not item:
        raise HTTPException(status_code=404, detail="Not in wishlist")
    wishlist_table.remove(Query_.id == item["id"])
    return {"message": "Removed from wishlist"}
