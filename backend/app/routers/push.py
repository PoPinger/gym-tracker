from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.models import User
from app.schemas.schemas import PushSubscriptionIn, PushEndpoint, RestPushIn
from app.auth.auth import get_current_user
from app.services import push_service

router = APIRouter(prefix="/push", tags=["push"])


@router.get("/key")
def get_key():
    """Public VAPID key the browser subscribes with; push is off when the keys are not configured."""
    if not push_service.enabled():
        return {"enabled": False, "key": None}
    return {"enabled": True, "key": settings.VAPID_PUBLIC_KEY}


@router.post("/subscriptions", status_code=204)
def subscribe(data: PushSubscriptionIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not push_service.enabled():
        raise HTTPException(503, "Powiadomienia są wyłączone")
    push_service.subscribe(db, user.id, data.endpoint, data.keys.p256dh, data.keys.auth)


@router.delete("/subscriptions", status_code=204)
def unsubscribe(data: PushEndpoint, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    push_service.unsubscribe(db, user.id, data.endpoint)


@router.put("/rest", status_code=204)
def schedule_rest(data: RestPushIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Schedule the "rest is over" push for this device (replaces the one already scheduled)."""
    if not push_service.enabled():
        return
    sub = push_service.find(db, user.id, data.endpoint)
    if not sub:
        raise HTTPException(404, "Subskrypcja nie została znaleziona")
    push_service.schedule(sub, data.seconds, data.title, data.body)


@router.delete("/rest", status_code=204)
def cancel_rest(data: PushEndpoint, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if push_service.find(db, user.id, data.endpoint):
        push_service.cancel(data.endpoint)
