from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserResponse
from app.core.deps import get_admin_user
from app.core.security import hash_password

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    users = db.query(User).filter(User.role != "admin").order_by(User.created_at.desc()).all()
    return [
        UserResponse(id=str(u.id), username=u.username, email=u.email, role=u.role, created_at=str(u.created_at))
        for u in users
    ]


class UserUpdateRequest(BaseModel):
    username: str | None = None
    email: str | None = None
    password: str | None = None


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    request: UserUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    user = db.query(User).filter(User.id == user_id, User.role != "admin").first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if request.username:
        user.username = request.username
    if request.email:
        user.email = request.email
    if request.password:
        user.password_hash = hash_password(request.password)

    db.commit()
    db.refresh(user)
    return UserResponse(id=str(user.id), username=user.username, email=user.email, role=user.role, created_at=str(user.created_at))


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    user = db.query(User).filter(User.id == user_id, User.role != "admin").first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    db.delete(user)
    db.commit()
