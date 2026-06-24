import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.auth.security import get_current_user, require_role
from app.database import vendors_table, Query_
from app.models.schemas import VendorRegister, VendorResponse, UserRole

router = APIRouter(prefix="/vendors", tags=["Vendors"])


@router.post("/register", response_model=VendorResponse)
def register_vendor(data: VendorRegister, user: dict = Depends(get_current_user)):
    existing = vendors_table.get(Query_.user_id == user["id"])
    if existing:
        raise HTTPException(status_code=400, detail="Already registered as vendor")
    vendor = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "business_name": data.business_name,
        "description": data.description,
        "contact_email": data.contact_email,
        "contact_phone": data.contact_phone,
        "address": data.address,
        "is_approved": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    vendors_table.insert(vendor)
    return VendorResponse(**vendor)


@router.get("/me", response_model=VendorResponse)
def get_my_vendor(user: dict = Depends(get_current_user)):
    vendor = vendors_table.get(Query_.user_id == user["id"])
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    return VendorResponse(**vendor)


@router.get("", response_model=list[VendorResponse])
def list_vendors(admin: dict = Depends(require_role(UserRole.ADMIN))):
    return [VendorResponse(**v) for v in vendors_table.all()]


@router.patch("/{vendor_id}/approve", response_model=VendorResponse)
def approve_vendor(vendor_id: str, admin: dict = Depends(require_role(UserRole.ADMIN))):
    vendor = vendors_table.get(Query_.id == vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    vendors_table.update({"is_approved": True}, Query_.id == vendor_id)
    return VendorResponse(**vendors_table.get(Query_.id == vendor_id))
