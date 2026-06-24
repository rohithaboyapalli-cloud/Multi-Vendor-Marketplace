import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.auth.security import (
    create_access_token,
    hash_password,
    require_role,
    user_to_response,
    verify_password,
    get_current_user,
)
from app.database import users_table, Query_
from app.models.schemas import UserCreate, UserLogin, UserResponse, UserRole, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
def login(credentials: UserLogin):
    user = users_table.get(Query_.email == credentials.email)
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is deactivated")
    token = create_access_token({"sub": user["id"], "role": user["role"]})
    return Token(access_token=token, user=user_to_response(user))


@router.get("/me", response_model=UserResponse)
def get_me(user: dict = Depends(get_current_user)):
    return user_to_response(user)


@router.post("/users", response_model=UserResponse)
def create_user(
    data: UserCreate,
    admin: dict = Depends(require_role(UserRole.ADMIN)),
):
    if users_table.get(Query_.email == data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = {
        "id": str(uuid.uuid4()),
        "email": data.email,
        "password": hash_password(data.password),
        "full_name": data.full_name,
        "role": data.role.value,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    users_table.insert(user)
    return user_to_response(user)


@router.get("/users", response_model=list[UserResponse])
def list_users(admin: dict = Depends(require_role(UserRole.ADMIN))):
    return [user_to_response(u) for u in users_table.all()]


@router.patch("/users/{user_id}/toggle", response_model=UserResponse)
def toggle_user(user_id: str, admin: dict = Depends(require_role(UserRole.ADMIN))):
    user = users_table.get(Query_.id == user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    users_table.update({"is_active": not user.get("is_active", True)}, Query_.id == user_id)
    return user_to_response(users_table.get(Query_.id == user_id))
