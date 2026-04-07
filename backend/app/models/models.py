from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey,
    Text, Boolean, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    plans = relationship("TrainingPlan", back_populates="user", cascade="all, delete-orphan")
    weight_cycles = relationship("WeightCycle", back_populates="user", cascade="all, delete-orphan")
    day_logs = relationship("TrainingDayLog", back_populates="user", passive_deletes=True)
    exercise_logs = relationship("ExerciseLog", back_populates="user", passive_deletes=True)


class TrainingPlan(Base):
    __tablename__ = "training_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    days_per_week = Column(Integer, nullable=False)
    months = Column(Integer, nullable=False)
    status = Column(String(20), default="active")  # active, completed
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="plans")
    days = relationship("PlanDay", back_populates="plan", cascade="all, delete-orphan", order_by="PlanDay.day_order")
    weeks = relationship("TrainingWeek", back_populates="plan", cascade="all, delete-orphan", order_by="TrainingWeek.week_number")


class PlanDay(Base):
    __tablename__ = "plan_days"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("training_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    day_name = Column(String(100), nullable=False)
    day_order = Column(Integer, nullable=False)

    plan = relationship("TrainingPlan", back_populates="days")
    exercises = relationship("Exercise", back_populates="plan_day", cascade="all, delete-orphan", order_by="Exercise.exercise_order")
    day_logs = relationship("TrainingDayLog", back_populates="plan_day", passive_deletes=True)


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    plan_day_id = Column(Integer, ForeignKey("plan_days.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    muscle_group = Column(String(100), nullable=False)
    sets = Column(Integer, nullable=False)
    exercise_order = Column(Integer, nullable=False, default=0)

    plan_day = relationship("PlanDay", back_populates="exercises")
    exercise_logs = relationship("ExerciseLog", back_populates="exercise", passive_deletes=True)


class TrainingWeek(Base):
    __tablename__ = "training_weeks"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("training_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    week_number = Column(Integer, nullable=False)
    status = Column(String(20), default="active")  # active, completed

    plan = relationship("TrainingPlan", back_populates="weeks")
    day_logs = relationship("TrainingDayLog", back_populates="training_week", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("plan_id", "week_number", name="uq_plan_week"),
    )


class TrainingDayLog(Base):
    __tablename__ = "training_day_logs"

    id = Column(Integer, primary_key=True, index=True)
    training_week_id = Column(Integer, ForeignKey("training_weeks.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_day_id = Column(Integer, ForeignKey("plan_days.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), default="active")  # active, completed
    completed_at = Column(DateTime, nullable=True)

    training_week = relationship("TrainingWeek", back_populates="day_logs")
    plan_day = relationship("PlanDay", back_populates="day_logs")
    user = relationship("User", back_populates="day_logs")
    exercise_logs = relationship("ExerciseLog", back_populates="day_log", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("training_week_id", "plan_day_id", "user_id", name="uq_week_day_user"),
    )


class ExerciseLog(Base):
    __tablename__ = "exercise_logs"

    id = Column(Integer, primary_key=True, index=True)
    training_day_log_id = Column(Integer, ForeignKey("training_day_logs.id", ondelete="CASCADE"), nullable=False, index=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    day_log = relationship("TrainingDayLog", back_populates="exercise_logs")
    exercise = relationship("Exercise", back_populates="exercise_logs")
    user = relationship("User", back_populates="exercise_logs")
    set_logs = relationship("SetLog", back_populates="exercise_log", cascade="all, delete-orphan", order_by="SetLog.set_number")


class SetLog(Base):
    __tablename__ = "set_logs"

    id = Column(Integer, primary_key=True, index=True)
    exercise_log_id = Column(Integer, ForeignKey("exercise_logs.id", ondelete="CASCADE"), nullable=False, index=True)
    set_number = Column(Integer, nullable=False)
    reps = Column(Integer, nullable=True)
    weight_kg = Column(Float, nullable=True)

    exercise_log = relationship("ExerciseLog", back_populates="set_logs")


class WeightCycle(Base):
    __tablename__ = "weight_cycles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    start_weight = Column(Float, nullable=False)
    months = Column(Integer, nullable=False)
    status = Column(String(20), default="active")  # active, completed
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="weight_cycles")
    weeks = relationship("WeightWeek", back_populates="cycle", cascade="all, delete-orphan", order_by="WeightWeek.week_number")


class WeightWeek(Base):
    __tablename__ = "weight_weeks"

    id = Column(Integer, primary_key=True, index=True)
    weight_cycle_id = Column(Integer, ForeignKey("weight_cycles.id", ondelete="CASCADE"), nullable=False, index=True)
    week_number = Column(Integer, nullable=False)
    status = Column(String(20), default="active")  # active, completed

    cycle = relationship("WeightCycle", back_populates="weeks")
    day_logs = relationship("WeightDayLog", back_populates="week", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("weight_cycle_id", "week_number", name="uq_cycle_week"),
    )


class WeightDayLog(Base):
    __tablename__ = "weight_day_logs"

    id = Column(Integer, primary_key=True, index=True)
    weight_week_id = Column(Integer, ForeignKey("weight_weeks.id", ondelete="CASCADE"), nullable=False, index=True)
    day_of_week = Column(Integer, nullable=False)  # 0=Mon, 6=Sun
    weight_kg = Column(Float, nullable=True)
    logged_at = Column(DateTime, nullable=True)

    week = relationship("WeightWeek", back_populates="day_logs")

    __table_args__ = (
        UniqueConstraint("weight_week_id", "day_of_week", name="uq_week_day"),
    )
