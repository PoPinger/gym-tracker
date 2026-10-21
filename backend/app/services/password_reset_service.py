import hashlib
import hmac
import secrets
from datetime import datetime, timedelta
from typing import Optional, Tuple
from fastapi import HTTPException
from jose import JWTError, jwt
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.auth.auth import hash_password
from app.config import settings
from app.models.models import User, PasswordResetCode, PasswordResetAttempt

# No 0/O, 1/I/L — codes are read aloud / retyped by hand
CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
CODE_TTL = timedelta(hours=24)
RESET_TOKEN_TTL = timedelta(minutes=15)
RESET_TOKEN_PURPOSE = "password_reset"
MAX_FAILED_ATTEMPTS = 5
ATTEMPT_WINDOW = timedelta(minutes=15)

INVALID_CODE = "Nieprawidłowy lub wygasły kod"
TOO_MANY_ATTEMPTS = "Zbyt wiele prób. Spróbuj ponownie za 15 minut"
INVALID_RESET_TOKEN = "Sesja resetu hasła wygasła. Zacznij od nowa"


def _normalize_code(code: str) -> str:
    return "".join(c for c in code.upper() if c.isalnum())


def _hash_code(code: str) -> str:
    return hmac.new(settings.SECRET_KEY.encode(), _normalize_code(code).encode(), hashlib.sha256).hexdigest()


def generate_code(db: Session, user: User) -> Tuple[str, datetime]:
    """Create a new one-time code for the user, invalidating any previous unused one."""
    now = datetime.utcnow()
    db.query(PasswordResetCode).filter(
        PasswordResetCode.user_id == user.id, PasswordResetCode.used_at.is_(None)
    ).update({PasswordResetCode.used_at: now}, synchronize_session=False)

    raw = "".join(secrets.choice(CODE_ALPHABET) for _ in range(8))
    expires_at = now + CODE_TTL
    db.add(PasswordResetCode(user_id=user.id, code_hash=_hash_code(raw), expires_at=expires_at))
    db.commit()
    return f"{raw[:4]}-{raw[4:]}", expires_at


def _active_code(db: Session, user_id: int) -> Optional[PasswordResetCode]:
    return (
        db.query(PasswordResetCode)
        .filter(
            PasswordResetCode.user_id == user_id,
            PasswordResetCode.used_at.is_(None),
            PasswordResetCode.expires_at > datetime.utcnow(),
        )
        .order_by(PasswordResetCode.created_at.desc())
        .first()
    )


def verify_code(db: Session, email: str, code: str) -> str:
    """Check e-mail + code; return a short-lived reset token. Same error for every failure."""
    email = email.strip().lower()
    now = datetime.utcnow()

    failed = (
        db.query(func.count(PasswordResetAttempt.id))
        .filter(PasswordResetAttempt.email == email, PasswordResetAttempt.attempted_at > now - ATTEMPT_WINDOW)
        .scalar()
    )
    if failed >= MAX_FAILED_ATTEMPTS:
        raise HTTPException(status_code=429, detail=TOO_MANY_ATTEMPTS)

    user = db.query(User).filter(func.lower(User.email) == email).first()
    reset_code = _active_code(db, user.id) if user else None
    if (
        reset_code is None
        or len(_normalize_code(code)) != 8
        or not hmac.compare_digest(reset_code.code_hash, _hash_code(code))
    ):
        db.add(PasswordResetAttempt(email=email, attempted_at=now))
        db.commit()
        raise HTTPException(status_code=400, detail=INVALID_CODE)

    return jwt.encode(
        {"sub": str(user.id), "purpose": RESET_TOKEN_PURPOSE, "cid": reset_code.id, "exp": now + RESET_TOKEN_TTL},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def complete_reset(db: Session, reset_token: str, new_password: str) -> None:
    """Set the new password, burn the code and revoke all existing sessions."""
    try:
        payload = jwt.decode(reset_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=400, detail=INVALID_RESET_TOKEN)
    if payload.get("purpose") != RESET_TOKEN_PURPOSE:
        raise HTTPException(status_code=400, detail=INVALID_RESET_TOKEN)

    reset_code = (
        db.query(PasswordResetCode)
        .filter(PasswordResetCode.id == payload.get("cid"))
        .with_for_update()
        .first()
    )
    if (
        reset_code is None
        or str(reset_code.user_id) != payload.get("sub")
        or reset_code.used_at is not None
        or reset_code.expires_at <= datetime.utcnow()
    ):
        raise HTTPException(status_code=400, detail=INVALID_RESET_TOKEN)

    user = db.query(User).filter(User.id == reset_code.user_id).first()
    user.password_hash = hash_password(new_password)
    user.token_version = (user.token_version or 0) + 1
    reset_code.used_at = datetime.utcnow()
    db.commit()
