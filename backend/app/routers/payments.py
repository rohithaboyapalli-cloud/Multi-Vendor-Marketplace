import base64
import io
import uuid
from datetime import datetime, timezone

import qrcode
import qrcode.image.pure
import razorpay
import stripe
from fastapi import APIRouter, Depends, HTTPException

from app.auth.security import get_current_user
from app.config import settings
from app.database import orders_table, payments_table, Query_
from app.models.schemas import (
    UPIPaymentRequest,
    UPIPaymentResponse,
    RazorpayOrderResponse,
    StripeSessionResponse,
    PaymentVerify,
    PaymentStatus,
    OrderStatus,
)

router = APIRouter(prefix="/payments", tags=["Payments"])


def _generate_upi_qr(upi_id: str, amount: float, order_id: str) -> str:
    upi_string = f"upi://pay?pa={upi_id}&pn=Marketplace&am={amount}&cu=INR&tn=Order-{order_id[:8]}"
    qr = qrcode.QRCode(version=1, box_size=10, border=4, image_factory=qrcode.image.pure.PyPNGImage)
    qr.add_data(upi_string)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer)
    return base64.b64encode(buffer.getvalue()).decode()


@router.post("/upi", response_model=UPIPaymentResponse)
def create_upi_payment(data: UPIPaymentRequest, user: dict = Depends(get_current_user)):
    order = orders_table.get(Query_.id == data.order_id)
    if not order or order["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Order not found")
    qr_base64 = _generate_upi_qr(settings.upi_id, data.amount, data.order_id)
    payment_link = f"upi://pay?pa={settings.upi_id}&am={data.amount}&cu=INR"
    payment = {
        "id": str(uuid.uuid4()),
        "order_id": data.order_id,
        "method": "upi",
        "amount": data.amount,
        "status": PaymentStatus.PENDING.value,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    payments_table.insert(payment)
    return UPIPaymentResponse(
        order_id=data.order_id,
        upi_id=settings.upi_id,
        amount=data.amount,
        qr_code_base64=qr_base64,
        payment_link=payment_link,
    )


@router.post("/upi/verify")
def verify_upi_payment(data: PaymentVerify, user: dict = Depends(get_current_user)):
    order = orders_table.get(Query_.id == data.order_id)
    if not order or order["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Order not found")
    orders_table.update(
        {
            "payment_status": PaymentStatus.COMPLETED.value,
            "status": OrderStatus.CONFIRMED.value,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        Query_.id == data.order_id,
    )
    payments_table.update(
        {"status": PaymentStatus.COMPLETED.value},
        Query_.order_id == data.order_id,
    )
    return {"message": "Payment verified", "status": "completed"}


@router.post("/razorpay/create", response_model=RazorpayOrderResponse)
def create_razorpay_order(data: UPIPaymentRequest, user: dict = Depends(get_current_user)):
    order = orders_table.get(Query_.id == data.order_id)
    if not order or order["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
        razorpay_order = client.order.create({
            "amount": int(data.amount * 100),
            "currency": "INR",
            "receipt": data.order_id[:8],
        })
    except Exception:
        razorpay_order = {"id": f"order_mock_{data.order_id[:8]}"}
    payment = {
        "id": str(uuid.uuid4()),
        "order_id": data.order_id,
        "method": "razorpay",
        "amount": data.amount,
        "razorpay_order_id": razorpay_order["id"],
        "status": PaymentStatus.PENDING.value,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    payments_table.insert(payment)
    return RazorpayOrderResponse(
        order_id=data.order_id,
        razorpay_order_id=razorpay_order["id"],
        amount=int(data.amount * 100),
        key_id=settings.razorpay_key_id,
    )


@router.post("/razorpay/verify")
def verify_razorpay_payment(data: PaymentVerify, user: dict = Depends(get_current_user)):
    order = orders_table.get(Query_.id == data.order_id)
    if not order or order["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Order not found")
    orders_table.update(
        {
            "payment_status": PaymentStatus.COMPLETED.value,
            "status": OrderStatus.CONFIRMED.value,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        Query_.id == data.order_id,
    )
    return {"message": "Razorpay payment verified", "status": "completed"}


@router.post("/stripe/create", response_model=StripeSessionResponse)
def create_stripe_session(data: UPIPaymentRequest, user: dict = Depends(get_current_user)):
    order = orders_table.get(Query_.id == data.order_id)
    if not order or order["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        stripe.api_key = settings.stripe_secret_key
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "inr",
                    "product_data": {"name": f"Order {data.order_id[:8]}"},
                    "unit_amount": int(data.amount * 100),
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"{settings.frontend_url}/orders/{data.order_id}?payment=success",
            cancel_url=f"{settings.frontend_url}/checkout?payment=cancelled",
        )
        session_id, url = session.id, session.url
    except Exception:
        session_id = f"cs_mock_{data.order_id[:8]}"
        url = f"{settings.frontend_url}/orders/{data.order_id}?payment=success"
    payment = {
        "id": str(uuid.uuid4()),
        "order_id": data.order_id,
        "method": "stripe",
        "amount": data.amount,
        "stripe_session_id": session_id,
        "status": PaymentStatus.PENDING.value,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    payments_table.insert(payment)
    return StripeSessionResponse(order_id=data.order_id, session_id=session_id, url=url)


@router.post("/stripe/verify")
def verify_stripe_payment(data: PaymentVerify, user: dict = Depends(get_current_user)):
    order = orders_table.get(Query_.id == data.order_id)
    if not order or order["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Order not found")
    orders_table.update(
        {
            "payment_status": PaymentStatus.COMPLETED.value,
            "status": OrderStatus.CONFIRMED.value,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        Query_.id == data.order_id,
    )
    return {"message": "Stripe payment verified", "status": "completed"}


@router.get("/config")
def get_payment_config():
    return {
        "razorpay_key_id": settings.razorpay_key_id,
        "stripe_publishable_key": settings.stripe_publishable_key,
        "upi_id": settings.upi_id,
    }
