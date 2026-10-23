from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, TrainingPlan, PlanDay, Exercise, TrainingWeek, TrainingDayLog, ExerciseLog
from app.schemas.schemas import (
    PlanCreate, PlanUpdate, PlanOut, PlanSummary,
    PlanDayCreate, PlanDayOut, PlanDayUpdate,
    ExerciseCreate, ExerciseOut, ExerciseUpdate,
    ExerciseReorderRequest, WeekOut, WeekSummary, DayLogCreate, DayLogOut, DayCompleteIn, SetLogIn,
    PlanStructureUpdate, WeekDeloadIn,
)
from app.auth.auth import get_current_user
from app.services import plan_service

router = APIRouter(tags=["plans"])


# ── Plans ─────────────────────────────────────────────────────────────────────

@router.get("/plans", response_model=List[PlanSummary])
def list_plans(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return plan_service.get_user_plans(db, user.id)


@router.post("/plans", response_model=PlanOut, status_code=201)
def create_plan(data: PlanCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return plan_service.create_plan(db, user.id, data)


@router.get("/plans/{plan_id}", response_model=PlanOut)
def get_plan(plan_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    plan = plan_service.get_plan(db, plan_id, user.id)
    if not plan:
        raise HTTPException(404, "Plan nie został znaleziony")
    return plan


@router.put("/plans/{plan_id}", response_model=PlanOut)
def update_plan(plan_id: int, data: PlanUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    plan = plan_service.get_plan(db, plan_id, user.id)
    if not plan:
        raise HTTPException(404, "Plan nie został znaleziony")
    return plan_service.update_plan(db, plan, data)


@router.post("/plans/{plan_id}/copy", response_model=PlanOut, status_code=201)
def copy_plan(plan_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    plan = plan_service.get_plan(db, plan_id, user.id)
    if not plan:
        raise HTTPException(404, "Plan nie został znaleziony")
    return plan_service.copy_plan(db, plan, user.id)


@router.post("/plans/{plan_id}/complete", response_model=PlanOut)
def complete_plan(plan_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    plan = plan_service.get_plan(db, plan_id, user.id)
    if not plan:
        raise HTTPException(404, "Plan nie został znaleziony")
    return plan_service.complete_plan(db, plan)


@router.put("/plans/{plan_id}/structure", response_model=PlanOut)
def update_plan_structure(plan_id: int, data: PlanStructureUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    plan = plan_service.get_plan(db, plan_id, user.id)
    if not plan:
        raise HTTPException(404, "Plan nie został znaleziony")
    return plan_service.update_plan_structure(db, plan, data)


@router.delete("/plans/{plan_id}", status_code=204)
def delete_plan(plan_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    plan = plan_service.get_plan(db, plan_id, user.id)
    if not plan:
        raise HTTPException(404, "Plan nie został znaleziony")
    db.delete(plan)
    db.commit()


# ── Plan Days ─────────────────────────────────────────────────────────────────

@router.get("/plans/{plan_id}/days", response_model=List[PlanDayOut])
def get_plan_days(plan_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    plan = plan_service.get_plan(db, plan_id, user.id)
    if not plan:
        raise HTTPException(404, "Plan nie został znaleziony")
    return plan.days


@router.post("/plans/{plan_id}/days", response_model=PlanDayOut, status_code=201)
def add_plan_day(plan_id: int, data: PlanDayCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    plan = plan_service.get_plan(db, plan_id, user.id)
    if not plan:
        raise HTTPException(404, "Plan nie został znaleziony")
    day = PlanDay(plan_id=plan_id, day_name=data.day_name, day_order=data.day_order, color=data.color)
    db.add(day)
    db.flush()
    for ex in data.exercises:
        db.add(Exercise(
            plan_day_id=day.id,
            name=ex.name,
            muscle_group=ex.muscle_group,
            sets=ex.sets,
            exercise_order=ex.exercise_order,
        ))
    db.commit()
    db.refresh(day)
    return day


@router.put("/plan-days/{day_id}", response_model=PlanDayOut)
def update_plan_day(day_id: int, data: PlanDayUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    day = db.query(PlanDay).filter(PlanDay.id == day_id).first()
    if not day:
        raise HTTPException(404, "Dzień nie został znaleziony")
    plan = plan_service.get_plan(db, day.plan_id, user.id)
    if not plan:
        raise HTTPException(403, "Brak dostępu")
    if data.day_name is not None:
        day.day_name = data.day_name
    if data.day_order is not None:
        day.day_order = data.day_order
    if data.color is not None:
        day.color = data.color
    db.commit()
    db.refresh(day)
    return day


# ── Exercises ─────────────────────────────────────────────────────────────────

@router.post("/plan-days/{day_id}/exercises", response_model=ExerciseOut, status_code=201)
def add_exercise(day_id: int, data: ExerciseCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    day = db.query(PlanDay).filter(PlanDay.id == day_id).first()
    if not day:
        raise HTTPException(404, "Dzień nie został znaleziony")
    plan = plan_service.get_plan(db, day.plan_id, user.id)
    if not plan:
        raise HTTPException(403, "Brak dostępu")
    ex = Exercise(
        plan_day_id=day_id,
        name=data.name,
        muscle_group=data.muscle_group,
        sets=data.sets,
        exercise_order=data.exercise_order,
    )
    db.add(ex)
    db.commit()
    db.refresh(ex)
    return ex


@router.put("/exercises/{ex_id}", response_model=ExerciseOut)
def update_exercise(ex_id: int, data: ExerciseUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ex = db.query(Exercise).filter(Exercise.id == ex_id).first()
    if not ex:
        raise HTTPException(404, "Ćwiczenie nie zostało znalezione")
    day = db.query(PlanDay).filter(PlanDay.id == ex.plan_day_id).first()
    plan = plan_service.get_plan(db, day.plan_id, user.id)
    if not plan:
        raise HTTPException(403, "Brak dostępu")
    if data.name is not None:
        ex.name = data.name
    if data.muscle_group is not None:
        ex.muscle_group = data.muscle_group
    if data.sets is not None:
        ex.sets = data.sets
    if data.exercise_order is not None:
        ex.exercise_order = data.exercise_order
    if data.note is not None:
        ex.note = data.note.strip() or None
    db.commit()
    db.refresh(ex)
    return ex


@router.delete("/exercises/{ex_id}", status_code=204)
def delete_exercise(ex_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ex = db.query(Exercise).filter(Exercise.id == ex_id).first()
    if not ex:
        raise HTTPException(404, "Ćwiczenie nie zostało znalezione")
    day = db.query(PlanDay).filter(PlanDay.id == ex.plan_day_id).first()
    plan = plan_service.get_plan(db, day.plan_id, user.id)
    if not plan:
        raise HTTPException(403, "Brak dostępu")
    db.delete(ex)
    db.commit()


@router.get("/exercises/{ex_id}/history")
def get_exercise_history(ex_id: int, all_plans: bool = False,
                         db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ex = db.query(Exercise).filter(Exercise.id == ex_id).first()
    if not ex:
        raise HTTPException(404, "Ćwiczenie nie zostało znalezione")
    day = db.query(PlanDay).filter(PlanDay.id == ex.plan_day_id).first()
    plan = plan_service.get_plan(db, day.plan_id, user.id)
    if not plan:
        raise HTTPException(403, "Brak dostępu")
    return plan_service.get_exercise_history(db, ex, user.id, all_plans)


@router.post("/exercises/reorder", status_code=200)
def reorder_exercises(data: ExerciseReorderRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    for item in data.exercises:
        ex = db.query(Exercise).filter(Exercise.id == item.id).first()
        if ex:
            ex.exercise_order = item.exercise_order
    db.commit()
    return {"ok": True}


# ── Training Weeks & Logs ─────────────────────────────────────────────────────

@router.get("/plans/{plan_id}/weeks", response_model=List[WeekSummary])
def get_plan_weeks(plan_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    plan = plan_service.get_plan(db, plan_id, user.id)
    if not plan:
        raise HTTPException(404, "Plan nie został znaleziony")
    return plan_service.get_plan_weeks(db, plan_id)


@router.get("/weeks/{week_id}/days")
def get_week_days(week_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    week, logs = plan_service.get_week_days(db, week_id, user.id)
    if week is None:
        raise HTTPException(404, "Tydzień nie został znaleziony")
    plan = db.query(TrainingPlan).filter(TrainingPlan.id == week.plan_id).first()

    log_map = {l.plan_day_id: l for l in logs}
    days_out = []
    for day in plan.days:
        log = log_map.get(day.id)
        days_out.append({
            "plan_day_id": day.id,
            "day_name": day.day_name,
            "day_order": day.day_order,
            "color": day.color,
            "log_id": log.id if log else None,
            "status": log.status if log else "not_started",
            "skipped": bool(log.skipped) if log else False,
        })

    return {
        "week_id": week.id,
        "week_number": week.week_number,
        "plan_id": week.plan_id,
        "plan_name": plan.name,
        "status": week.status,
        "is_deload": bool(week.is_deload),
        "days": days_out,
    }


@router.post("/day-logs", response_model=DayLogOut, status_code=201)
def create_day_log(data: DayLogCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    week = db.query(TrainingWeek).filter(TrainingWeek.id == data.training_week_id).first()
    if not week:
        raise HTTPException(404, "Tydzień nie został znaleziony")
    plan = plan_service.get_plan(db, week.plan_id, user.id)
    if not plan:
        raise HTTPException(403, "Brak dostępu")
    log = plan_service.get_or_create_day_log(db, data.training_week_id, data.plan_day_id, user.id)
    return _serialize_day_log(log)


@router.get("/day-logs/{log_id}")
def get_day_log(log_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    log = plan_service.get_day_log(db, log_id, user.id)
    if not log:
        raise HTTPException(404, "Dziennik nie został znaleziony")
    week = db.query(TrainingWeek).filter(TrainingWeek.id == log.training_week_id).first()
    plan = db.query(TrainingPlan).filter(TrainingPlan.id == week.plan_id).first() if week else None

    # Deload weeks are never a reference: "previous week" is the last earlier non-deload week,
    # "week 1" the plan's first non-deload week
    prev_week, week1 = plan_service.reference_weeks(db, week) if week else (None, None)

    # Fetch previous week data for comparison
    prev_week_data = {}
    prev_week_skipped = []
    if prev_week:
        prev_log = db.query(TrainingDayLog).filter(
            TrainingDayLog.training_week_id == prev_week.id,
            TrainingDayLog.plan_day_id == log.plan_day_id,
            TrainingDayLog.user_id == user.id,
        ).first()
        if prev_log:
            for ex_log in prev_log.exercise_logs:
                sets = [{"set_number": s.set_number, "reps": s.reps, "weight_kg": s.weight_kg, "rir": s.rir}
                        for s in ex_log.set_logs]
                prev_week_data[ex_log.exercise_id] = sets
                if prev_log.skipped or ex_log.skipped:
                    prev_week_skipped.append(ex_log.exercise_id)

    # Fetch week 1 data for comparison
    week1_data = {}
    if week1:
        w1_log = db.query(TrainingDayLog).filter(
            TrainingDayLog.training_week_id == week1.id,
            TrainingDayLog.plan_day_id == log.plan_day_id,
            TrainingDayLog.user_id == user.id,
        ).first()
        if w1_log:
            for ex_log in w1_log.exercise_logs:
                sets = [{"set_number": s.set_number, "reps": s.reps, "weight_kg": s.weight_kg, "rir": s.rir}
                        for s in ex_log.set_logs]
                week1_data[ex_log.exercise_id] = sets

    result = _serialize_day_log(log)
    result["prev_week_data"] = prev_week_data
    result["prev_week_skipped"] = prev_week_skipped
    result["week1_data"] = week1_data
    result["prev_week_number"] = prev_week.week_number if prev_week else None
    result["week1_number"] = week1.week_number if week1 else None
    result["week_number"] = week.week_number if week else None
    result["is_deload"] = bool(week.is_deload) if week else False
    result["plan_name"] = plan.name if plan else None
    return result


def _check_workout_date(workout_date: Optional[date]) -> None:
    # Server runs in UTC; allow one day of slack for users ahead of UTC (frontend enforces local today)
    if workout_date and workout_date > date.today() + timedelta(days=1):
        raise HTTPException(400, "Data treningu nie może być z przyszłości")


@router.put("/exercise-logs/{log_id}/sets")
def save_sets(log_id: int, sets: List[SetLogIn], workout_date: Optional[date] = None,
              skipped: Optional[bool] = None, exercise_skipped: Optional[bool] = None,
              db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _check_workout_date(workout_date)
    result = plan_service.save_exercise_sets(
        db, log_id, sets, user.id, workout_date, skipped, exercise_skipped)
    if not result:
        raise HTTPException(404, "Dziennik ćwiczenia nie został znaleziony")
    return {"ok": True, "exercise_log_id": log_id}


@router.post("/day-logs/{log_id}/complete")
def complete_day(log_id: int, data: Optional[DayCompleteIn] = None,
                 db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    workout_date = data.workout_date if data else None
    _check_workout_date(workout_date)
    log = plan_service.complete_day_log(db, log_id, user.id, workout_date, data.skipped if data else None)
    if not log:
        raise HTTPException(404, "Dziennik nie został znaleziony")
    return {"ok": True, "status": log.status}


@router.put("/weeks/{week_id}/deload", response_model=WeekSummary)
def set_week_deload(week_id: int, data: WeekDeloadIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    week = plan_service.set_week_deload(db, week_id, user.id, data.is_deload)
    if not week:
        raise HTTPException(404, "Tydzień nie został znaleziony")
    return week


@router.post("/weeks/{week_id}/complete")
def complete_week(week_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    week = plan_service.complete_week(db, week_id, user.id)
    if not week:
        raise HTTPException(404, "Tydzień nie został znaleziony")
    return {"ok": True, "status": week.status}


def _serialize_day_log(log) -> dict:
    exercise_logs = []
    for ex_log in log.exercise_logs:
        ex = ex_log.exercise
        set_logs = [
            {"id": s.id, "set_number": s.set_number, "reps": s.reps, "weight_kg": s.weight_kg, "rir": s.rir}
            for s in ex_log.set_logs
        ]
        exercise_logs.append({
            "id": ex_log.id,
            "exercise_id": ex_log.exercise_id,
            "exercise_name": ex.name if ex else "Nieznane",
            "muscle_group": ex.muscle_group if ex else "",
            "sets": ex.sets if ex else 0,
            "rep_min": ex.rep_min if ex else None,
            "rep_max": ex.rep_max if ex else None,
            "rest_seconds": ex.rest_seconds if ex else None,
            "note": ex.note if ex else None,
            "skipped": bool(ex_log.skipped),
            "set_logs": set_logs,
        })
    return {
        "id": log.id,
        "training_week_id": log.training_week_id,
        "plan_day_id": log.plan_day_id,
        "status": log.status,
        "completed_at": log.completed_at.isoformat() if log.completed_at else None,
        "workout_date": log.workout_date.isoformat() if log.workout_date else None,
        "skipped": bool(log.skipped),
        "exercise_logs": exercise_logs,
    }
