from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, WeightCycle, WeightWeek, WeightDayLog
from app.schemas.schemas import WeightCycleCreate, WeightCycleOut, WeightWeekOut, WeightDayLogOut
from app.auth.auth import get_current_user
from app.services import weight_service

router = APIRouter(prefix="/weight", tags=["weight"])


@router.get("/current-cycle")
def get_current_cycle(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cycle = weight_service.get_active_cycle(db, user.id)
    if not cycle:
        return None
    return _serialize_cycle(cycle)


@router.post("/cycles", status_code=201)
def create_cycle(data: WeightCycleCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cycle = weight_service.create_cycle(db, user.id, data)
    return _serialize_cycle(cycle)


@router.delete("/cycles/{cycle_id}", status_code=204)
def delete_cycle(cycle_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ok = weight_service.delete_cycle(db, cycle_id, user.id)
    if not ok:
        raise HTTPException(404, "Cykl nie został znaleziony")


@router.get("/cycles/{cycle_id}/weeks")
def get_cycle_weeks(cycle_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    weeks = weight_service.get_cycle_weeks(db, cycle_id, user.id)
    if weeks is None:
        raise HTTPException(404, "Cykl nie został znaleziony")
    return [_serialize_week(w) for w in weeks]


@router.put("/day-logs/{day_log_id}")
def save_day_weight(day_log_id: int, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    weight_kg = body.get("weight_kg")
    if weight_kg is None:
        raise HTTPException(400, "Wymagana jest wartość wagi")
    log = weight_service.save_day_weight(db, day_log_id, float(weight_kg), user.id)
    if not log:
        raise HTTPException(404, "Wpis dnia nie został znaleziony")
    return {"id": log.id, "day_of_week": log.day_of_week, "weight_kg": log.weight_kg, "logged_at": log.logged_at}


@router.post("/weeks/{week_id}/complete")
def complete_week(week_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    week = weight_service.complete_weight_week(db, week_id, user.id)
    if not week:
        raise HTTPException(404, "Tydzień nie został znaleziony")
    return {"ok": True, "status": week.status}


def _serialize_week(week: WeightWeek) -> dict:
    avg = weight_service.compute_week_average(week)
    return {
        "id": week.id,
        "week_number": week.week_number,
        "status": week.status,
        "average_weight": avg,
        "day_logs": [
            {
                "id": d.id,
                "day_of_week": d.day_of_week,
                "weight_kg": d.weight_kg,
                "logged_at": d.logged_at.isoformat() if d.logged_at else None,
            }
            for d in sorted(week.day_logs, key=lambda x: x.day_of_week)
        ],
    }


def _serialize_cycle(cycle: WeightCycle) -> dict:
    return {
        "id": cycle.id,
        "start_weight": cycle.start_weight,
        "months": cycle.months,
        "status": cycle.status,
        "created_at": cycle.created_at.isoformat(),
        "weeks": [_serialize_week(w) for w in cycle.weeks],
    }
