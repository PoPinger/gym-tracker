from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.models import (
    TrainingPlan, PlanDay, Exercise, TrainingWeek,
    TrainingDayLog, ExerciseLog, SetLog
)
from app.schemas.schemas import PlanCreate, PlanUpdate, PlanDayCreate, ExerciseCreate


def create_plan(db: Session, user_id: int, data: PlanCreate) -> TrainingPlan:
    plan = TrainingPlan(
        user_id=user_id,
        name=data.name,
        days_per_week=data.days_per_week,
        months=data.months,
        status="active",
    )
    db.add(plan)
    db.flush()

    for day_data in data.days:
        plan_day = PlanDay(
            plan_id=plan.id,
            day_name=day_data.day_name,
            day_order=day_data.day_order,
        )
        db.add(plan_day)
        db.flush()
        for ex_data in day_data.exercises:
            exercise = Exercise(
                plan_day_id=plan_day.id,
                name=ex_data.name,
                muscle_group=ex_data.muscle_group,
                sets=ex_data.sets,
                exercise_order=ex_data.exercise_order,
            )
            db.add(exercise)

    total_weeks = data.months * 4
    for w in range(1, total_weeks + 1):
        db.add(TrainingWeek(plan_id=plan.id, week_number=w, status="active"))

    db.commit()
    db.refresh(plan)
    return plan


def get_user_plans(db: Session, user_id: int) -> List[TrainingPlan]:
    return (
        db.query(TrainingPlan)
        .filter(TrainingPlan.user_id == user_id)
        .order_by(TrainingPlan.created_at.desc())
        .all()
    )


def get_plan(db: Session, plan_id: int, user_id: int) -> Optional[TrainingPlan]:
    return (
        db.query(TrainingPlan)
        .filter(TrainingPlan.id == plan_id, TrainingPlan.user_id == user_id)
        .first()
    )


def update_plan(db: Session, plan: TrainingPlan, data: PlanUpdate) -> TrainingPlan:
    if data.name is not None:
        plan.name = data.name
    if data.days_per_week is not None:
        plan.days_per_week = data.days_per_week
    if data.months is not None:
        plan.months = data.months
    db.commit()
    db.refresh(plan)
    return plan


def copy_plan(db: Session, original: TrainingPlan, user_id: int) -> TrainingPlan:
    new_plan = TrainingPlan(
        user_id=user_id,
        name=f"{original.name} (Kopia)",
        days_per_week=original.days_per_week,
        months=original.months,
        status="active",
    )
    db.add(new_plan)
    db.flush()

    for day in original.days:
        new_day = PlanDay(
            plan_id=new_plan.id,
            day_name=day.day_name,
            day_order=day.day_order,
        )
        db.add(new_day)
        db.flush()
        for ex in day.exercises:
            db.add(Exercise(
                plan_day_id=new_day.id,
                name=ex.name,
                muscle_group=ex.muscle_group,
                sets=ex.sets,
                exercise_order=ex.exercise_order,
            ))

    total_weeks = original.months * 4
    for w in range(1, total_weeks + 1):
        db.add(TrainingWeek(plan_id=new_plan.id, week_number=w, status="active"))

    db.commit()
    db.refresh(new_plan)
    return new_plan


def update_plan_structure(db: Session, plan: TrainingPlan, data) -> TrainingPlan:
    plan.name = data.name

    for day_data in data.days:
        day = db.query(PlanDay).filter(
            PlanDay.id == day_data.id, PlanDay.plan_id == plan.id
        ).first()
        if not day:
            continue
        day.day_name = day_data.day_name

        existing_ids = {ex.id for ex in day.exercises}
        submitted_ids = {ex.id for ex in day_data.exercises if ex.id is not None}

        # Delete exercises removed from the list
        for ex_id in (existing_ids - submitted_ids):
            ex = db.query(Exercise).filter(Exercise.id == ex_id).first()
            if ex:
                db.delete(ex)

        # Update existing / add new
        for ex_data in day_data.exercises:
            if ex_data.id is not None:
                ex = db.query(Exercise).filter(Exercise.id == ex_data.id).first()
                if ex:
                    ex.name = ex_data.name
                    ex.muscle_group = ex_data.muscle_group
                    ex.sets = ex_data.sets
                    ex.exercise_order = ex_data.exercise_order
                    # Synchronizuj SetLog dla wszystkich istniejących ExerciseLog tego ćwiczenia
                    existing_ex_logs = db.query(ExerciseLog).filter(
                        ExerciseLog.exercise_id == ex.id
                    ).all()
                    for ex_log in existing_ex_logs:
                        current_set_numbers = {
                            s.set_number for s in db.query(SetLog)
                            .filter(SetLog.exercise_log_id == ex_log.id).all()
                        }
                        new_sets = ex_data.sets
                        for set_num in current_set_numbers:
                            if set_num > new_sets:
                                db.query(SetLog).filter(
                                    SetLog.exercise_log_id == ex_log.id,
                                    SetLog.set_number == set_num
                                ).delete()
                        for set_num in range(1, new_sets + 1):
                            if set_num not in current_set_numbers:
                                db.add(SetLog(
                                    exercise_log_id=ex_log.id,
                                    set_number=set_num,
                                    reps=None,
                                    weight_kg=None,
                                ))
            else:
                db.add(Exercise(
                    plan_day_id=day.id,
                    name=ex_data.name,
                    muscle_group=ex_data.muscle_group,
                    sets=ex_data.sets,
                    exercise_order=ex_data.exercise_order,
                ))

    db.commit()
    db.refresh(plan)
    return plan


def complete_plan(db: Session, plan: TrainingPlan) -> TrainingPlan:
    plan.status = "completed"
    db.commit()
    db.refresh(plan)
    return plan


def get_plan_weeks(db: Session, plan_id: int) -> List[TrainingWeek]:
    return (
        db.query(TrainingWeek)
        .filter(TrainingWeek.plan_id == plan_id)
        .order_by(TrainingWeek.week_number)
        .all()
    )


def get_week_days(db: Session, week_id: int, user_id: int):
    week = db.query(TrainingWeek).filter(TrainingWeek.id == week_id).first()
    if not week:
        return None, None
    plan = db.query(TrainingPlan).filter(
        TrainingPlan.id == week.plan_id,
        TrainingPlan.user_id == user_id
    ).first()
    if not plan:
        return None, None

    logs = (
        db.query(TrainingDayLog)
        .filter(TrainingDayLog.training_week_id == week_id, TrainingDayLog.user_id == user_id)
        .all()
    )
    return week, logs


def get_or_create_day_log(db: Session, week_id: int, plan_day_id: int, user_id: int) -> TrainingDayLog:
    log = db.query(TrainingDayLog).filter(
        TrainingDayLog.training_week_id == week_id,
        TrainingDayLog.plan_day_id == plan_day_id,
        TrainingDayLog.user_id == user_id,
    ).first()

    # Explicit query to avoid SQLAlchemy lazy-load / identity-map stale data
    exercises = (
        db.query(Exercise)
        .filter(Exercise.plan_day_id == plan_day_id)
        .order_by(Exercise.exercise_order)
        .all()
    )

    if log:
        # Sync: add ExerciseLogs for any exercises added to the plan after this log was created
        existing_exercise_ids = {el.exercise_id for el in log.exercise_logs}
        added = False
        for exercise in exercises:
            if exercise.id not in existing_exercise_ids:
                ex_log = ExerciseLog(
                    training_day_log_id=log.id,
                    exercise_id=exercise.id,
                    user_id=user_id,
                )
                db.add(ex_log)
                db.flush()
                for s in range(1, exercise.sets + 1):
                    db.add(SetLog(
                        exercise_log_id=ex_log.id,
                        set_number=s,
                        reps=None,
                        weight_kg=None,
                    ))
                added = True
        if added:
            db.commit()
            db.refresh(log)
        return log

    log = TrainingDayLog(
        training_week_id=week_id,
        plan_day_id=plan_day_id,
        user_id=user_id,
        status="active",
    )
    db.add(log)
    db.flush()

    for exercise in exercises:
        ex_log = ExerciseLog(
            training_day_log_id=log.id,
            exercise_id=exercise.id,
            user_id=user_id,
        )
        db.add(ex_log)
        db.flush()
        for s in range(1, exercise.sets + 1):
            db.add(SetLog(
                exercise_log_id=ex_log.id,
                set_number=s,
                reps=None,
                weight_kg=None,
            ))

    db.commit()
    db.refresh(log)
    return log


def get_day_log(db: Session, log_id: int, user_id: int) -> Optional[TrainingDayLog]:
    return db.query(TrainingDayLog).filter(
        TrainingDayLog.id == log_id,
        TrainingDayLog.user_id == user_id,
    ).first()


def save_exercise_sets(db: Session, exercise_log_id: int, sets_data: list, user_id: int):
    ex_log = db.query(ExerciseLog).filter(
        ExerciseLog.id == exercise_log_id,
        ExerciseLog.user_id == user_id,
    ).first()
    if not ex_log:
        return None

    for s in sets_data:
        set_log = db.query(SetLog).filter(
            SetLog.exercise_log_id == exercise_log_id,
            SetLog.set_number == s.set_number,
        ).first()
        if set_log:
            set_log.reps = s.reps
            set_log.weight_kg = s.weight_kg
        else:
            db.add(SetLog(
                exercise_log_id=exercise_log_id,
                set_number=s.set_number,
                reps=s.reps,
                weight_kg=s.weight_kg,
            ))
    db.commit()
    db.refresh(ex_log)
    return ex_log


def complete_day_log(db: Session, log_id: int, user_id: int) -> Optional[TrainingDayLog]:
    log = get_day_log(db, log_id, user_id)
    if not log:
        return None
    log.status = "completed"
    log.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(log)
    return log


def complete_week(db: Session, week_id: int, user_id: int) -> Optional[TrainingWeek]:
    week = db.query(TrainingWeek).filter(TrainingWeek.id == week_id).first()
    if not week:
        return None
    plan = db.query(TrainingPlan).filter(
        TrainingPlan.id == week.plan_id,
        TrainingPlan.user_id == user_id
    ).first()
    if not plan:
        return None
    week.status = "completed"
    db.commit()
    db.refresh(week)
    return week
