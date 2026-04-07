from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.models import WeightCycle, WeightWeek, WeightDayLog
from app.schemas.schemas import WeightCycleCreate


def get_active_cycle(db: Session, user_id: int) -> Optional[WeightCycle]:
    return (
        db.query(WeightCycle)
        .filter(WeightCycle.user_id == user_id, WeightCycle.status == "active")
        .order_by(WeightCycle.created_at.desc())
        .first()
    )


def create_cycle(db: Session, user_id: int, data: WeightCycleCreate) -> WeightCycle:
    cycle = WeightCycle(
        user_id=user_id,
        start_weight=data.start_weight,
        months=data.months,
        status="active",
    )
    db.add(cycle)
    db.flush()

    total_weeks = data.months * 4
    for w in range(1, total_weeks + 1):
        week = WeightWeek(
            weight_cycle_id=cycle.id,
            week_number=w,
            status="active",
        )
        db.add(week)
        db.flush()
        for d in range(7):
            db.add(WeightDayLog(
                weight_week_id=week.id,
                day_of_week=d,
                weight_kg=None,
                logged_at=None,
            ))

    db.commit()
    db.refresh(cycle)
    return cycle


def delete_cycle(db: Session, cycle_id: int, user_id: int) -> bool:
    cycle = db.query(WeightCycle).filter(
        WeightCycle.id == cycle_id,
        WeightCycle.user_id == user_id,
    ).first()
    if not cycle:
        return False
    db.delete(cycle)
    db.commit()
    return True


def get_cycle_weeks(db: Session, cycle_id: int, user_id: int) -> Optional[List[WeightWeek]]:
    cycle = db.query(WeightCycle).filter(
        WeightCycle.id == cycle_id,
        WeightCycle.user_id == user_id,
    ).first()
    if not cycle:
        return None
    return cycle.weeks


def save_day_weight(db: Session, day_log_id: int, weight_kg: float, user_id: int) -> Optional[WeightDayLog]:
    day_log = db.query(WeightDayLog).filter(WeightDayLog.id == day_log_id).first()
    if not day_log:
        return None
    week = db.query(WeightWeek).filter(WeightWeek.id == day_log.weight_week_id).first()
    cycle = db.query(WeightCycle).filter(
        WeightCycle.id == week.weight_cycle_id,
        WeightCycle.user_id == user_id,
    ).first()
    if not cycle:
        return None
    day_log.weight_kg = weight_kg
    day_log.logged_at = datetime.utcnow()
    db.commit()
    db.refresh(day_log)
    return day_log


def complete_weight_week(db: Session, week_id: int, user_id: int) -> Optional[WeightWeek]:
    week = db.query(WeightWeek).filter(WeightWeek.id == week_id).first()
    if not week:
        return None
    cycle = db.query(WeightCycle).filter(
        WeightCycle.id == week.weight_cycle_id,
        WeightCycle.user_id == user_id,
    ).first()
    if not cycle:
        return None
    week.status = "completed"
    db.commit()
    db.refresh(week)
    return week


def compute_week_average(week: WeightWeek) -> Optional[float]:
    weights = [d.weight_kg for d in week.day_logs if d.weight_kg is not None]
    if not weights:
        return None
    return round(sum(weights) / len(weights), 1)
