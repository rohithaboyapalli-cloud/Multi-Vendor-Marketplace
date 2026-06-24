from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    VENDOR = "vendor"


class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class PaymentMethod(str, Enum):
    UPI = "upi"
    RAZORPAY = "razorpay"
    STRIPE = "stripe"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


# Auth
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    role: UserRole = UserRole.USER


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    is_active: bool = True
    created_at: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Categories
class CategoryCreate(BaseModel):
    name: str
    description: str = ""
    image_url: str = ""


class CategoryResponse(BaseModel):
    id: str
    name: str
    description: str
    image_url: str


# Products
class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category_id: str
    vendor_id: str
    image_url: str = ""
    stock: int = 100


class ProductResponse(BaseModel):
    id: str
    name: str
    description: str
    price: float
    category_id: str
    category_name: str = ""
    vendor_id: str
    vendor_name: str = ""
    image_url: str
    stock: int
    created_at: str


# Platform prices for comparison
class PlatformPriceCreate(BaseModel):
    product_id: str
    platform_name: str
    price: float
    url: str = ""


class PlatformPriceResponse(BaseModel):
    id: str
    product_id: str
    platform_name: str
    price: float
    url: str


class CompareResponse(BaseModel):
    product: ProductResponse
    platform_prices: list[PlatformPriceResponse]
    best_deal: PlatformPriceResponse | None
    savings: float = 0


# Vendor
class VendorRegister(BaseModel):
    business_name: str
    description: str = ""
    contact_email: EmailStr
    contact_phone: str = ""
    address: str = ""


class VendorResponse(BaseModel):
    id: str
    user_id: str
    business_name: str
    description: str
    contact_email: str
    contact_phone: str
    address: str
    is_approved: bool
    created_at: str


# Address
class AddressCreate(BaseModel):
    label: str = "Home"
    full_name: str
    phone: str
    address_line1: str
    address_line2: str = ""
    city: str
    state: str
    pincode: str
    is_default: bool = False


class AddressResponse(BaseModel):
    id: str
    user_id: str
    label: str
    full_name: str
    phone: str
    address_line1: str
    address_line2: str
    city: str
    state: str
    pincode: str
    is_default: bool


# Cart & Wishlist
class CartItemCreate(BaseModel):
    product_id: str
    quantity: int = 1


class CartItemResponse(BaseModel):
    id: str
    product_id: str
    product: ProductResponse | None = None
    quantity: int


class WishlistItemResponse(BaseModel):
    id: str
    product_id: str
    product: ProductResponse | None = None
    added_at: str


# Orders
class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int


class OrderCreate(BaseModel):
    address_id: str
    items: list[OrderItemCreate]
    payment_method: PaymentMethod


class OrderItemResponse(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    unit_price: float
    total_price: float


class OrderResponse(BaseModel):
    id: str
    user_id: str
    address: AddressResponse
    items: list[OrderItemResponse]
    subtotal: float
    tax: float
    total: float
    status: OrderStatus
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    tracking_number: str = ""
    created_at: str
    updated_at: str


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    tracking_number: str = ""


# Payments
class UPIPaymentRequest(BaseModel):
    order_id: str
    amount: float


class UPIPaymentResponse(BaseModel):
    order_id: str
    upi_id: str
    amount: float
    qr_code_base64: str
    payment_link: str


class RazorpayOrderResponse(BaseModel):
    order_id: str
    razorpay_order_id: str
    amount: int
    currency: str = "INR"
    key_id: str


class StripeSessionResponse(BaseModel):
    order_id: str
    session_id: str
    url: str


class PaymentVerify(BaseModel):
    order_id: str
    payment_id: str = ""
    razorpay_signature: str = ""


# Analytics
class AnalyticsResponse(BaseModel):
    total_users: int
    total_vendors: int
    total_products: int
    total_orders: int
    total_revenue: float
    orders_by_status: dict[str, int]
    revenue_by_month: list[dict]
    top_products: list[dict]
    recent_orders: list[OrderResponse]
