from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.models import WeightCycle, WeightWeek, WeightDayLog
from app.schemas.schemas import WeightCycleCreate, WeightCycleUpdate


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
        goal=data.goal,
        status="active",
    )
    db.add(cycle)
    db.flush()

    _add_weeks(db, cycle.id, 1, data.months * 4)

    db.commit()
    db.refresh(cycle)
    return cycle


def _add_weeks(db: Session, cycle_id: int, first: int, last: int) -> None:
    """Create weeks first..last (inclusive), each with 7 empty days."""
    for w in range(first, last + 1):
        week = WeightWeek(
            weight_cycle_id=cycle_id,
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


def update_cycle(db: Session, cycle_id: int, user_id: int, data: WeightCycleUpdate) -> Optional[WeightCycle]:
    cycle = db.query(WeightCycle).filter(
        WeightCycle.id == cycle_id,
        WeightCycle.user_id == user_id,
    ).first()
    if not cycle:
        return None
    if data.goal is not None:
        cycle.goal = data.goal
    if data.months is not None:
        old_weeks = cycle.months * 4
        new_weeks = data.months * 4
        cycle.months = data.months
        if new_weeks > old_weeks:
            _add_weeks(db, cycle.id, old_weeks + 1, new_weeks)
        elif new_weeks < old_weeks:
            # Weeks beyond the new length go, with their logged weights (cascade)
            for week in [w for w in cycle.weeks if w.week_number > new_weeks]:
                db.delete(week)
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
