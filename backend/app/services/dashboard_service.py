from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.models.models import (
    TrainingPlan, TrainingWeek, TrainingDayLog, ExerciseLog, SetLog,
    WeightCycle, WeightWeek, WeightDayLog, PlanDay
)


def get_dashboard_data(db: Session, user_id: int) -> dict:
    # ── Active plan ──────────────────────────────────────────────────────────
    active_plan = (
        db.query(TrainingPlan)
        .filter(TrainingPlan.user_id == user_id, TrainingPlan.status == "active")
        .order_by(TrainingPlan.created_at.desc())
        .first()
    )

    current_plan_data = None
    plan_progress_data = None
    next_workout_data = None

    if active_plan:
        total_weeks = active_plan.months * 4
        completed_weeks = sum(1 for w in active_plan.weeks if w.status == "completed")
        current_week_num = completed_weeks + 1
        pct = round((completed_weeks / total_weeks) * 100) if total_weeks else 0

        # Find current week object
        current_week = next(
            (w for w in active_plan.weeks if w.week_number == current_week_num), None
        )

        # Find next unfinished day in current week
        next_day_name = None
        next_day_exercises = []
        if current_week:
            completed_day_ids = {
                dl.plan_day_id for dl in current_week.day_logs if dl.status == "completed"
            }
            for day in active_plan.days:
                if day.id not in completed_day_ids:
                    next_day_name = day.day_name
                    next_day_exercises = [
                        {"name": ex.name, "muscle_group": ex.muscle_group, "sets": ex.sets}
                        for ex in day.exercises[:3]
                    ]
                    break

        current_plan_data = {
            "id": active_plan.id,
            "name": active_plan.name,
            "current_week": current_week_num,
            "total_weeks": total_weeks,
            "next_day": next_day_name,
        }
        plan_progress_data = {
            "percentage": pct,
            "completed_weeks": completed_weeks,
            "total_weeks": total_weeks,
        }
        next_workout_data = {
            "day_name": next_day_name,
            "plan_name": active_plan.name,
            "preview_exercises": next_day_exercises,
        }

    # ── Last workout ─────────────────────────────────────────────────────────
    last_log = (
        db.query(TrainingDayLog)
        .filter(TrainingDayLog.user_id == user_id, TrainingDayLog.status == "completed")
        .order_by(TrainingDayLog.completed_at.desc())
        .first()
    )
    last_workout_data = None
    if last_log:
        plan_day = db.query(PlanDay).filter(PlanDay.id == last_log.plan_day_id).first()
        week = db.query(TrainingWeek).filter(TrainingWeek.id == last_log.training_week_id).first()
        plan = db.query(TrainingPlan).filter(TrainingPlan.id == week.plan_id).first() if week else None
        ex_count = len(last_log.exercise_logs)
        last_workout_data = {
            "id": last_log.id,
            "date": last_log.completed_at.isoformat() if last_log.completed_at else None,
            "plan_name": plan.name if plan else "Nieznany",
            "day_name": plan_day.day_name if plan_day else "Nieznany",
            "exercise_count": ex_count,
        }

    # ── Quick stats ──────────────────────────────────────────────────────────
    now = datetime.utcnow()
    week_start = now - timedelta(days=now.weekday())
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    all_completed = (
        db.query(TrainingDayLog)
        .filter(TrainingDayLog.user_id == user_id, TrainingDayLog.status == "completed")
        .all()
    )
    workouts_this_week = sum(
        1 for l in all_completed
        if l.completed_at and l.completed_at >= week_start
    )
    workouts_this_month = sum(
        1 for l in all_completed
        if l.completed_at and l.completed_at >= month_start
    )
    total_workouts = len(all_completed)

    quick_stats = {
        "this_week": workouts_this_week,
        "this_month": workouts_this_month,
        "total": total_workouts,
    }

    # ── Weight panel ─────────────────────────────────────────────────────────
    weight_panel = None
    active_cycle = (
        db.query(WeightCycle)
        .filter(WeightCycle.user_id == user_id, WeightCycle.status == "active")
        .order_by(WeightCycle.created_at.desc())
        .first()
    )
    if active_cycle:
        last_weight = None
        avg_last_week = None
        prev_avg = None
        completed_weeks = [w for w in active_cycle.weeks if w.status == "completed"]
        completed_weeks.sort(key=lambda w: w.week_number)

        all_logged = sorted(
            [d for w in active_cycle.weeks for d in w.day_logs if d.weight_kg is not None],
            key=lambda d: d.logged_at or datetime.min,
            reverse=True,
        )
        if all_logged:
            last_weight = all_logged[0].weight_kg

        if completed_weeks:
            last_cw = completed_weeks[-1]
            weights = [d.weight_kg for d in last_cw.day_logs if d.weight_kg is not None]
            avg_last_week = round(sum(weights) / len(weights), 1) if weights else None
            if len(completed_weeks) >= 2:
                prev_cw = completed_weeks[-2]
                pw = [d.weight_kg for d in prev_cw.day_logs if d.weight_kg is not None]
                prev_avg = round(sum(pw) / len(pw), 1) if pw else None

        change = None
        if avg_last_week is not None and prev_avg is not None:
            change = round(avg_last_week - prev_avg, 1)

        weight_panel = {
            "last_weight": last_weight,
            "avg_last_week": avg_last_week,
            "change_vs_prev_week": change,
        }

    # ── Recent workouts ──────────────────────────────────────────────────────
    recent_logs = (
        db.query(TrainingDayLog)
        .filter(TrainingDayLog.user_id == user_id, TrainingDayLog.status == "completed")
        .order_by(TrainingDayLog.completed_at.desc())
        .limit(3)
        .all()
    )
    recent_workouts = []
    for log in recent_logs:
        day = db.query(PlanDay).filter(PlanDay.id == log.plan_day_id).first()
        week = db.query(TrainingWeek).filter(TrainingWeek.id == log.training_week_id).first()
        plan = db.query(TrainingPlan).filter(TrainingPlan.id == week.plan_id).first() if week else None
        recent_workouts.append({
            "id": log.id,
            "date": log.completed_at.isoformat() if log.completed_at else None,
            "day_name": day.day_name if day else "Nieznany",
            "plan_name": plan.name if plan else "Nieznany",
        })

    # ── Best progress ────────────────────────────────────────────────────────
    best_progress = _compute_best_progress(db, user_id)

    # ── Streak ───────────────────────────────────────────────────────────────
    streak = _compute_streak(all_completed)

    return {
        "current_plan": current_plan_data,
        "plan_progress": plan_progress_data,
        "last_workout": last_workout_data,
        "quick_stats": quick_stats,
        "weight_panel": weight_panel,
        "next_workout": next_workout_data,
        "recent_workouts": recent_workouts,
        "best_progress": best_progress,
        "streak": streak,
    }


def _compute_best_progress(db: Session, user_id: int) -> Optional[dict]:
    try:
        # Find the exercise where weight increased most from first to last log
        ex_logs = (
            db.query(ExerciseLog)
            .filter(ExerciseLog.user_id == user_id)
            .all()
        )
        if not ex_logs:
            return None

        exercise_max: dict = {}
        for ex_log in ex_logs:
            ex_id = ex_log.exercise_id
            weights = [s.weight_kg for s in ex_log.set_logs if s.weight_kg is not None]
            if not weights:
                continue
            max_w = max(weights)
            if ex_id not in exercise_max:
                exercise_max[ex_id] = {"first": max_w, "last": max_w, "name": ex_log.exercise.name if ex_log.exercise else ""}
            else:
                exercise_max[ex_id]["last"] = max_w

        best = None
        best_gain = 0
        for ex_id, data in exercise_max.items():
            gain = data["last"] - data["first"]
            if gain > best_gain:
                best_gain = gain
                best = {"exercise": data["name"], "gain_kg": round(gain, 1), "current_weight": data["last"]}

        return best
    except Exception:
        return None


def _compute_streak(completed_logs: list) -> int:
    if not completed_logs:
        return 0
    dates = sorted(
        set(l.completed_at.date() for l in completed_logs if l.completed_at),
        reverse=True,
    )
    if not dates:
        return 0
    streak = 0
    today = datetime.utcnow().date()
    expected = today
    for d in dates:
        if d == expected or d == expected - timedelta(days=1):
            streak += 1
            expected = d - timedelta(days=1)
        else:
            break
    return streak
