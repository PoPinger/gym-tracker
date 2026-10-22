from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User
from app.schemas.schemas import AdminUserOut, MascotUpdate, ResetCodeOut
from app.auth.auth import get_current_admin
from app.services import password_reset_service

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin)])


@router.get("/users", response_model=List[AdminUserOut])
def list_users(db: Session = Depends(get_db)):
    # Most recently active first; never-active users last
    return db.query(User).order_by(User.last_active_at.desc().nulls_last(), User.created_at.desc()).all()


@router.put("/users/{user_id}/mascot", response_model=AdminUserOut)
def set_mascot(user_id: int, data: MascotUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie znaleziony")
    user.mascot = None if data.mascot == "kulka" else data.mascot  # default stays NULL
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/reset-code", response_model=ResetCodeOut)
def create_reset_code(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie znaleziony")
    code, expires_at = password_reset_service.generate_code(db, user)
    return ResetCodeOut(code=code, expires_at=expires_at)
