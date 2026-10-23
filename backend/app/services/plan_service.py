from datetime import date, datetime
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
            color=day_data.color,
        )
        db.add(plan_day)
        db.flush()
        for ex_data in day_data.exercises:
            exercise = Exercise(
                plan_day_id=plan_day.id,
                name=ex_data.name,
                muscle_group=ex_data.muscle_group,
                sets=ex_data.sets,
                rep_min=ex_data.rep_min,
                rep_max=ex_data.rep_max,
                rest_seconds=ex_data.rest_seconds,
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
        old_weeks = plan.months * 4
        new_weeks = data.months * 4
        plan.months = data.months

        if new_weeks > old_weeks:
            for w in range(old_weeks + 1, new_weeks + 1):
                db.add(TrainingWeek(plan_id=plan.id, week_number=w, status="active"))
            if plan.status == "completed":
                plan.status = "active"
        elif new_weeks < old_weeks:
            excess = (
                db.query(TrainingWeek)
                .filter(TrainingWeek.plan_id == plan.id, TrainingWeek.week_number > new_weeks)
                .all()
            )
            for week in excess:
                db.delete(week)

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
            color=day.color,
        )
        db.add(new_day)
        db.flush()
        for ex in day.exercises:
            db.add(Exercise(
                plan_day_id=new_day.id,
                name=ex.name,
                muscle_group=ex.muscle_group,
                sets=ex.sets,
                rep_min=ex.rep_min,
                rep_max=ex.rep_max,
                rest_seconds=ex.rest_seconds,
                note=ex.note,
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
        if day_data.color is not None:
            day.color = day_data.color

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
                    ex.rep_min = ex_data.rep_min
                    ex.rep_max = ex_data.rep_max
                    ex.rest_seconds = ex_data.rest_seconds
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
                    rep_min=ex_data.rep_min,
                    rep_max=ex_data.rep_max,
                    rest_seconds=ex_data.rest_seconds,
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


def save_exercise_sets(db: Session, exercise_log_id: int, sets_data: list, user_id: int,
                       workout_date: Optional[date] = None, skipped: Optional[bool] = None,
                       exercise_skipped: Optional[bool] = None):
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
            set_log.rir = s.rir
        else:
            db.add(SetLog(
                exercise_log_id=exercise_log_id,
                set_number=s.set_number,
                reps=s.reps,
                weight_kg=s.weight_kg,
                rir=s.rir,
            ))
    if workout_date:
        ex_log.day_log.workout_date = workout_date
    if skipped is not None:
        ex_log.day_log.skipped = skipped
    if exercise_skipped is not None:
        ex_log.skipped = exercise_skipped
    db.commit()
    db.refresh(ex_log)
    return ex_log


def complete_day_log(db: Session, log_id: int, user_id: int,
                     workout_date: Optional[date] = None,
                     skipped: Optional[bool] = None) -> Optional[TrainingDayLog]:
    log = get_day_log(db, log_id, user_id)
    if not log:
        return None
    log.status = "completed"
    log.completed_at = datetime.utcnow()
    if workout_date:
        log.workout_date = workout_date
    if skipped is not None:
        log.skipped = skipped
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


def set_week_deload(db: Session, week_id: int, user_id: int, is_deload: bool) -> Optional[TrainingWeek]:
    week = db.query(TrainingWeek).filter(TrainingWeek.id == week_id).first()
    if not week or not get_plan(db, week.plan_id, user_id):
        return None
    week.is_deload = is_deload
    db.commit()
    db.refresh(week)
    return week


def reference_weeks(db: Session, week: TrainingWeek):
    """(previous, first) earlier non-deload weeks of the plan, the progress references for `week`."""
    earlier = (
        db.query(TrainingWeek)
        .filter(
            TrainingWeek.plan_id == week.plan_id,
            TrainingWeek.week_number < week.week_number,
            TrainingWeek.is_deload.is_(False),
        )
        .order_by(TrainingWeek.week_number)
        .all()
    )
    return (earlier[-1], earlier[0]) if earlier else (None, None)


def _same_name(name: str) -> str:
    return " ".join(name.split()).lower()


def get_exercise_history(db: Session, exercise: Exercise, user_id: int, all_plans: bool) -> dict:
    """Every logged week of a plan exercise, oldest first; with all_plans also same-name exercises of the user's other plans."""
    own_plan_id = exercise.plan_day.plan_id
    rows = (
        db.query(Exercise, TrainingPlan)
        .join(PlanDay, PlanDay.id == Exercise.plan_day_id)
        .join(TrainingPlan, TrainingPlan.id == PlanDay.plan_id)
        .filter(TrainingPlan.user_id == user_id)
        .all()
    )
    matches = [(ex, p) for ex, p in rows if _same_name(ex.name) == _same_name(exercise.name)]
    has_other_plans = any(p.id != own_plan_id for _, p in matches)
    if not all_plans:
        matches = [(ex, p) for ex, p in matches if ex.id == exercise.id]
    plans_by_ex = {ex.id: p for ex, p in matches}

    logs = (
        db.query(ExerciseLog, TrainingDayLog, TrainingWeek)
        .join(TrainingDayLog, TrainingDayLog.id == ExerciseLog.training_day_log_id)
        .join(TrainingWeek, TrainingWeek.id == TrainingDayLog.training_week_id)
        .filter(ExerciseLog.exercise_id.in_(list(plans_by_ex)), ExerciseLog.user_id == user_id)
        .all()
    )
    entries = []
    for ex_log, day_log, week in logs:
        skipped = bool(day_log.skipped or ex_log.skipped)
        has_data = any(s.reps is not None or s.weight_kg is not None for s in ex_log.set_logs)
        if not has_data and not skipped:
            continue
        plan = plans_by_ex[ex_log.exercise_id]
        entries.append({
            "exercise_log_id": ex_log.id,
            "plan_id": plan.id,
            "plan_name": plan.name,
            "week_number": week.week_number,
            "is_deload": bool(week.is_deload),
            "skipped": skipped,
            "workout_date": day_log.workout_date.isoformat() if day_log.workout_date else None,
            "sets": [{"set_number": s.set_number, "reps": s.reps, "weight_kg": s.weight_kg, "rir": s.rir}
                     for s in ex_log.set_logs],
            "_order": (day_log.workout_date or date.max, plan.created_at or datetime.min, week.week_number),
        })
    entries.sort(key=lambda e: e["_order"])
    for e in entries:
        del e["_order"]

    return {
        "exercise_id": exercise.id,
        "exercise_name": exercise.name,
        "has_other_plans": has_other_plans,
        "notes": [{"plan_id": p.id, "plan_name": p.name, "note": ex.note} for ex, p in matches if ex.note],
        "entries": entries,
    }
