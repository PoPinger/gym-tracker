from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User
from app.config import settings
from app.schemas.schemas import (
    RegisterRequest, LoginRequest, TokenResponse, UserOut, ChangePasswordRequest,
    ResetVerifyRequest, ResetVerifyResponse, ResetCompleteRequest,
)
from app.auth.auth import hash_password, verify_password, create_user_token, get_current_user
from app.services import password_reset_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _mark_login(user: User) -> None:
    user.last_login_at = user.last_active_at = datetime.utcnow()


def _token_response(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_user_token(user),
        user_id=user.id,
        email=user.email,
        display_name=user.display_name,
        is_admin=user.is_admin,
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Ten adres e-mail jest już zarejestrowany")
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        display_name=data.display_name,
        is_admin=bool(settings.ADMIN_EMAIL.strip()) and data.email.lower() == settings.ADMIN_EMAIL.strip().lower(),
    )
    _mark_login(user)  # registration counts as a login
    db.add(user)
    db.commit()
    db.refresh(user)
    return _token_response(user)


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Nieprawidłowy e-mail lub hasło")
    _mark_login(user)
    db.commit()
    return _token_response(user)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/change-password", response_model=TokenResponse)
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 400, not 401: a 401 makes the frontend log the user out
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Nieprawidłowe obecne hasło")
    current_user.password_hash = hash_password(data.new_password)
    current_user.token_version = (current_user.token_version or 0) + 1  # log out other devices
    db.commit()
    db.refresh(current_user)
    return _token_response(current_user)


@router.post("/password-reset/verify", response_model=ResetVerifyResponse)
def password_reset_verify(data: ResetVerifyRequest, db: Session = Depends(get_db)):
    return ResetVerifyResponse(reset_token=password_reset_service.verify_code(db, data.email, data.code))


@router.post("/password-reset/complete", status_code=204)
def password_reset_complete(data: ResetCompleteRequest, db: Session = Depends(get_db)):
    password_reset_service.complete_reset(db, data.reset_token, data.new_password)
