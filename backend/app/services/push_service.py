"""Web Push for the rest timer: subscriptions per user/device and one scheduled push per device.

Scheduled pushes live in memory (a timer per device endpoint). A rest lasts a few minutes, so a server
restart during a rest only loses that one notification; the in-app timer still works.
"""
import json
import logging
import threading
from typing import Optional

from pywebpush import WebPushException, webpush
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models.models import PushSubscription

log = logging.getLogger(__name__)

PUSH_TTL_S = 120  # a "start your set" push delivered later than this is useless

_timers: dict[str, threading.Timer] = {}
_lock = threading.Lock()


def enabled() -> bool:
    return bool(settings.VAPID_PUBLIC_KEY and settings.VAPID_PRIVATE_KEY and settings.VAPID_SUBJECT)


def subscribe(db: Session, user_id: int, endpoint: str, p256dh: str, auth: str) -> None:
    # The endpoint identifies the device; it moves to the user now logged in on it
    sub = db.query(PushSubscription).filter(PushSubscription.endpoint == endpoint).first()
    if sub:
        sub.user_id, sub.p256dh, sub.auth = user_id, p256dh, auth
    else:
        db.add(PushSubscription(user_id=user_id, endpoint=endpoint, p256dh=p256dh, auth=auth))
    db.commit()


def unsubscribe(db: Session, user_id: int, endpoint: str) -> None:
    cancel(endpoint)
    db.query(PushSubscription).filter(
        PushSubscription.endpoint == endpoint, PushSubscription.user_id == user_id
    ).delete()
    db.commit()


def find(db: Session, user_id: int, endpoint: str) -> Optional[PushSubscription]:
    return db.query(PushSubscription).filter(
        PushSubscription.endpoint == endpoint, PushSubscription.user_id == user_id
    ).first()


def _send(endpoint: str, p256dh: str, auth: str, payload: dict) -> None:
    with _lock:
        _timers.pop(endpoint, None)
    try:
        webpush(
            subscription_info={"endpoint": endpoint, "keys": {"p256dh": p256dh, "auth": auth}},
            data=json.dumps(payload),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": settings.VAPID_SUBJECT},
            ttl=PUSH_TTL_S,
            headers={"Urgency": "high"},
            timeout=10,
        )
    except WebPushException as e:
        status = e.response.status_code if e.response is not None else None
        if status in (404, 410):  # the browser dropped the subscription
            db = SessionLocal()
            try:
                db.query(PushSubscription).filter(PushSubscription.endpoint == endpoint).delete()
                db.commit()
            finally:
                db.close()
        else:
            log.warning("Web Push failed (%s)", status)
    except Exception:
        log.exception("Web Push failed")


def schedule(sub: PushSubscription, seconds: float, title: str, body: str) -> None:
    """Send the push to this device after `seconds`, replacing any push already scheduled for it."""
    payload = {"title": title, "body": body, "tag": "rest-timer"}
    timer = threading.Timer(seconds, _send, args=(sub.endpoint, sub.p256dh, sub.auth, payload))
    timer.daemon = True
    with _lock:
        old = _timers.pop(sub.endpoint, None)
        if old:
            old.cancel()
        _timers[sub.endpoint] = timer
    timer.start()


def cancel(endpoint: str) -> None:
    with _lock:
        timer = _timers.pop(endpoint, None)
    if timer:
        timer.cancel()
