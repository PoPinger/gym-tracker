from datetime import datetime, timedelta
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.models import User

bearer_scheme = HTTPBearer()

ACTIVITY_THROTTLE = timedelta(minutes=5)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_user_token(user: User) -> str:
    """Access token bound to the user's token_version, so bumping it revokes every session."""
    return create_access_token({"sub": str(user.id), "tv": user.token_version or 0})


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy lub wygasły token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials)
    user_id: int = payload.get("sub")
    # Purpose-scoped tokens (e.g. password reset) are not access tokens
    if user_id is None or payload.get("purpose") is not None:
        raise HTTPException(status_code=401, detail="Nieprawidłowy token")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Użytkownik nie znaleziony")
    # Tokens issued before token_version existed carry no "tv" and count as version 0
    if payload.get("tv", 0) != (user.token_version or 0):
        raise HTTPException(status_code=401, detail="Sesja wygasła. Zaloguj się ponownie")
    _touch_last_active(db, user)
    return user


def _touch_last_active(db: Session, user: User) -> None:
    """Record activity, but write at most once per ACTIVITY_THROTTLE per user."""
    now = datetime.utcnow()
    if user.last_active_at is not None and now - user.last_active_at < ACTIVITY_THROTTLE:
        return
    # Re-checked in the WHERE so concurrent requests don't both write
    updated = (
        db.query(User)
        .filter(
            User.id == user.id,
            or_(User.last_active_at.is_(None), User.last_active_at < now - ACTIVITY_THROTTLE),
        )
        .update({User.last_active_at: now}, synchronize_session=False)
    )
    if updated:
        db.commit()


def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Brak uprawnień administratora")
    return current_user
