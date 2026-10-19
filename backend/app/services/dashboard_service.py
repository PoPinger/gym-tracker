from datetime import date, datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models.models import (
    TrainingPlan, TrainingWeek, TrainingDayLog, WeightCycle, WeightWeek, PlanDay
)


def get_dashboard_data(db: Session, user_id: int) -> dict:
    has_plan = db.query(TrainingPlan.id).filter(TrainingPlan.user_id == user_id).first() is not None

    # ── Quick stats ──────────────────────────────────────────────────────────
    # Workouts are counted by their "Data treningu"; skipped and undated days don't count
    today = date.today()
    workout_dates = [
        d for (d,) in db.query(TrainingDayLog.workout_date).filter(
            TrainingDayLog.user_id == user_id,
            TrainingDayLog.workout_date.isnot(None),
            TrainingDayLog.skipped.is_(False),
        )
    ]
    quick_stats = {
        "this_month": sum(1 for d in workout_dates if d.year == today.year and d.month == today.month),
        "this_year": sum(1 for d in workout_dates if d.year == today.year),
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
        weeks = sorted(active_cycle.weeks, key=lambda w: w.week_number)
        week1_avg = _week_average(weeks[0]) if weeks else None
        # The active (first unfinished) week; before it has readings, the latest week that has some
        current = next((w for w in weeks if w.status != "completed"), None)
        current_avg = _week_average(current) if current else None
        if current_avg is None:
            current_avg = next((a for a in (_week_average(w) for w in reversed(weeks)) if a is not None), None)
        change = None
        if week1_avg is not None and current_avg is not None:
            change = round(current_avg - week1_avg, 1)
        weight_panel = {
            "goal": active_cycle.goal,
            "week1_avg": week1_avg,
            "current_week_avg": current_avg,
            "change": change,
            # Averages of the weeks that have readings, in order (sparkline on the weight tile)
            "weekly_avgs": [a for a in (_week_average(w) for w in weeks) if a is not None],
        }

    # ── Workout calendar ─────────────────────────────────────────────────────
    calendar_rows = (
        db.query(TrainingDayLog, PlanDay, TrainingWeek)
        .join(PlanDay, PlanDay.id == TrainingDayLog.plan_day_id)
        .join(TrainingWeek, TrainingWeek.id == TrainingDayLog.training_week_id)
        .filter(
            TrainingDayLog.user_id == user_id,
            TrainingDayLog.workout_date.isnot(None),
            TrainingDayLog.skipped.is_(False),
        )
        .order_by(TrainingDayLog.workout_date, PlanDay.day_order)
        .all()
    )
    workout_calendar = [
        {
            "date": log.workout_date.isoformat(),
            "log_id": log.id,
            "plan_id": week.plan_id,
            "week_id": week.id,
            "plan_day_id": day.id,
            "day_name": day.day_name,
        }
        for log, day, week in calendar_rows
    ]

    return {
        "has_plan": has_plan,
        "quick_stats": quick_stats,
        "weight_panel": weight_panel,
        "workout_calendar": workout_calendar,
        "streak": _compute_streak(db, user_id),
    }


def _week_average(week: WeightWeek) -> Optional[float]:
    """Average of the logged days, rounded like the "Moja waga" view; None without readings."""
    weights = [d.weight_kg for d in week.day_logs if d.weight_kg is not None]
    return round(sum(weights) / len(weights), 1) if weights else None


def _compute_streak(db: Session, user_id: int) -> int:
    """Consecutive finished training weeks, newest first, without a skipped training day.

    Unfinished weeks (including the current one) are ignored, so they never break the streak.
    """
    weeks = (
        db.query(TrainingWeek)
        .join(TrainingPlan, TrainingPlan.id == TrainingWeek.plan_id)
        .filter(TrainingPlan.user_id == user_id, TrainingWeek.status == "completed")
        .all()
    )

    def finished_at(week) -> datetime:
        times = [l.completed_at for l in week.day_logs if l.completed_at]
        return max(times) if times else datetime.min

    streak = 0
    for week in sorted(weeks, key=finished_at, reverse=True):
        if any(l.skipped for l in week.day_logs):
            break
        streak += 1
    return streak
