import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.auth.security import get_current_user
from app.database import addresses_table, Query_
from app.models.schemas import AddressCreate, AddressResponse

router = APIRouter(prefix="/addresses", tags=["Addresses"])


def _to_response(addr: dict) -> AddressResponse:
    return AddressResponse(**addr)


@router.get("", response_model=list[AddressResponse])
def list_addresses(user: dict = Depends(get_current_user)):
    addrs = addresses_table.search(Query_.user_id == user["id"])
    return [_to_response(a) for a in addrs]


@router.post("", response_model=AddressResponse)
def create_address(data: AddressCreate, user: dict = Depends(get_current_user)):
    if data.is_default:
        for addr in addresses_table.search(Query_.user_id == user["id"]):
            addresses_table.update({"is_default": False}, Query_.id == addr["id"])
    addr = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        **data.model_dump(),
    }
    addresses_table.insert(addr)
    return _to_response(addr)


@router.put("/{address_id}", response_model=AddressResponse)
def update_address(address_id: str, data: AddressCreate, user: dict = Depends(get_current_user)):
    addr = addresses_table.get((Query_.id == address_id) & (Query_.user_id == user["id"]))
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    if data.is_default:
        for a in addresses_table.search(Query_.user_id == user["id"]):
            addresses_table.update({"is_default": False}, Query_.id == a["id"])
    addresses_table.update(data.model_dump(), Query_.id == address_id)
    return _to_response(addresses_table.get(Query_.id == address_id))


@router.delete("/{address_id}")
def delete_address(address_id: str, user: dict = Depends(get_current_user)):
    addr = addresses_table.get((Query_.id == address_id) & (Query_.user_id == user["id"]))
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    addresses_table.remove(Query_.id == address_id)
    return {"message": "Address deleted"}


@router.patch("/{address_id}/default", response_model=AddressResponse)
def set_default(address_id: str, user: dict = Depends(get_current_user)):
    addr = addresses_table.get((Query_.id == address_id) & (Query_.user_id == user["id"]))
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    for a in addresses_table.search(Query_.user_id == user["id"]):
        addresses_table.update({"is_default": False}, Query_.id == a["id"])
    addresses_table.update({"is_default": True}, Query_.id == address_id)
    return _to_response(addresses_table.get(Query_.id == address_id))
