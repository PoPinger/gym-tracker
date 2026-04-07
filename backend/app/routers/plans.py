from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, TrainingPlan, PlanDay, Exercise, TrainingWeek, TrainingDayLog, ExerciseLog
from app.schemas.schemas import (
    PlanCreate, PlanUpdate, PlanOut, PlanSummary,
    PlanDayCreate, PlanDayOut, PlanDayUpdate,
    ExerciseCreate, ExerciseOut, ExerciseUpdate,
    ExerciseReorderRequest, WeekOut, WeekSummary, DayLogCreate, DayLogOut, SetLogIn,
    PlanStructureUpdate,
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
    day = PlanDay(plan_id=plan_id, day_name=data.day_name, day_order=data.day_order)
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
            "log_id": log.id if log else None,
            "status": log.status if log else "not_started",
        })

    return {
        "week_id": week.id,
        "week_number": week.week_number,
        "plan_id": week.plan_id,
        "plan_name": plan.name,
        "status": week.status,
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

    # Fetch previous week data for comparison
    prev_week_data = {}
    if week and week.week_number > 1:
        prev_week = db.query(TrainingWeek).filter(
            TrainingWeek.plan_id == week.plan_id,
            TrainingWeek.week_number == week.week_number - 1,
        ).first()
        if prev_week:
            prev_log = db.query(TrainingDayLog).filter(
                TrainingDayLog.training_week_id == prev_week.id,
                TrainingDayLog.plan_day_id == log.plan_day_id,
                TrainingDayLog.user_id == user.id,
            ).first()
            if prev_log:
                for ex_log in prev_log.exercise_logs:
                    sets = [{"set_number": s.set_number, "reps": s.reps, "weight_kg": s.weight_kg}
                            for s in ex_log.set_logs]
                    prev_week_data[ex_log.exercise_id] = sets

    # Fetch week 1 data for comparison
    week1_data = {}
    if week and week.week_number > 1:
        week1 = db.query(TrainingWeek).filter(
            TrainingWeek.plan_id == week.plan_id,
            TrainingWeek.week_number == 1,
        ).first()
        if week1:
            w1_log = db.query(TrainingDayLog).filter(
                TrainingDayLog.training_week_id == week1.id,
                TrainingDayLog.plan_day_id == log.plan_day_id,
                TrainingDayLog.user_id == user.id,
            ).first()
            if w1_log:
                for ex_log in w1_log.exercise_logs:
                    sets = [{"set_number": s.set_number, "reps": s.reps, "weight_kg": s.weight_kg}
                            for s in ex_log.set_logs]
                    week1_data[ex_log.exercise_id] = sets

    result = _serialize_day_log(log)
    result["prev_week_data"] = prev_week_data
    result["week1_data"] = week1_data
    result["week_number"] = week.week_number if week else None
    result["plan_name"] = plan.name if plan else None
    return result


@router.put("/exercise-logs/{log_id}/sets")
def save_sets(log_id: int, sets: List[SetLogIn], db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    result = plan_service.save_exercise_sets(db, log_id, sets, user.id)
    if not result:
        raise HTTPException(404, "Dziennik ćwiczenia nie został znaleziony")
    return {"ok": True, "exercise_log_id": log_id}


@router.post("/day-logs/{log_id}/complete")
def complete_day(log_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    log = plan_service.complete_day_log(db, log_id, user.id)
    if not log:
        raise HTTPException(404, "Dziennik nie został znaleziony")
    return {"ok": True, "status": log.status}


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
            {"id": s.id, "set_number": s.set_number, "reps": s.reps, "weight_kg": s.weight_kg}
            for s in ex_log.set_logs
        ]
        exercise_logs.append({
            "id": ex_log.id,
            "exercise_id": ex_log.exercise_id,
            "exercise_name": ex.name if ex else "Nieznane",
            "muscle_group": ex.muscle_group if ex else "",
            "sets": ex.sets if ex else 0,
            "set_logs": set_logs,
        })
    return {
        "id": log.id,
        "training_week_id": log.training_week_id,
        "plan_day_id": log.plan_day_id,
        "status": log.status,
        "completed_at": log.completed_at.isoformat() if log.completed_at else None,
        "exercise_logs": exercise_logs,
    }
