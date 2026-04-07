from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError("Hasło musi mieć co najmniej 6 znaków")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    display_name: Optional[str]


class UserOut(BaseModel):
    id: int
    email: str
    display_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Plans ─────────────────────────────────────────────────────────────────────

class ExerciseEditItem(BaseModel):
    id: Optional[int] = None   # None = new exercise
    name: str
    muscle_group: str
    sets: int
    exercise_order: int = 0


class PlanDayEdit(BaseModel):
    id: int
    day_name: str
    exercises: List[ExerciseEditItem] = []


class PlanStructureUpdate(BaseModel):
    name: str
    days: List[PlanDayEdit] = []


class ExerciseCreate(BaseModel):
    name: str
    muscle_group: str
    sets: int
    exercise_order: int = 0


class ExerciseOut(BaseModel):
    id: int
    name: str
    muscle_group: str
    sets: int
    exercise_order: int

    class Config:
        from_attributes = True


class ExerciseUpdate(BaseModel):
    name: Optional[str] = None
    muscle_group: Optional[str] = None
    sets: Optional[int] = None
    exercise_order: Optional[int] = None


class PlanDayCreate(BaseModel):
    day_name: str
    day_order: int
    exercises: List[ExerciseCreate] = []


class PlanDayOut(BaseModel):
    id: int
    day_name: str
    day_order: int
    exercises: List[ExerciseOut] = []

    class Config:
        from_attributes = True


class PlanDayUpdate(BaseModel):
    day_name: Optional[str] = None
    day_order: Optional[int] = None


class PlanCreate(BaseModel):
    name: str
    days_per_week: int
    months: int
    days: List[PlanDayCreate] = []


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    days_per_week: Optional[int] = None
    months: Optional[int] = None


class PlanOut(BaseModel):
    id: int
    name: str
    days_per_week: int
    months: int
    status: str
    created_at: datetime
    days: List[PlanDayOut] = []

    class Config:
        from_attributes = True


class PlanSummary(BaseModel):
    id: int
    name: str
    days_per_week: int
    months: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Training Logs ─────────────────────────────────────────────────────────────

class SetLogIn(BaseModel):
    set_number: int
    reps: Optional[int] = None
    weight_kg: Optional[float] = None


class SetLogOut(BaseModel):
    id: int
    set_number: int
    reps: Optional[int]
    weight_kg: Optional[float]

    class Config:
        from_attributes = True


class ExerciseLogOut(BaseModel):
    id: int
    exercise_id: int
    exercise_name: str
    muscle_group: str
    sets: int
    set_logs: List[SetLogOut] = []

    class Config:
        from_attributes = True


class DayLogCreate(BaseModel):
    plan_day_id: int
    training_week_id: int


class DayLogOut(BaseModel):
    id: int
    training_week_id: int
    plan_day_id: int
    status: str
    completed_at: Optional[datetime]
    exercise_logs: List[ExerciseLogOut] = []

    class Config:
        from_attributes = True


class WeekOut(BaseModel):
    id: int
    week_number: int
    status: str
    day_logs: List[DayLogOut] = []

    class Config:
        from_attributes = True


class WeekSummary(BaseModel):
    id: int
    week_number: int
    status: str

    class Config:
        from_attributes = True


class ExerciseReorderItem(BaseModel):
    id: int
    exercise_order: int


class ExerciseReorderRequest(BaseModel):
    exercises: List[ExerciseReorderItem]


# ── Weight ────────────────────────────────────────────────────────────────────

class WeightCycleCreate(BaseModel):
    start_weight: float
    months: int

    @field_validator("months")
    @classmethod
    def months_range(cls, v):
        if not 1 <= v <= 12:
            raise ValueError("Liczba miesięcy musi wynosić od 1 do 12")
        return v

    @field_validator("start_weight")
    @classmethod
    def weight_positive(cls, v):
        if v <= 0:
            raise ValueError("Waga musi być większa od zera")
        return v


class WeightDayLogOut(BaseModel):
    id: int
    day_of_week: int
    weight_kg: Optional[float]
    logged_at: Optional[datetime]

    class Config:
        from_attributes = True


class WeightDayLogUpdate(BaseModel):
    weight_kg: float
    day_of_week: int
    weight_week_id: int


class WeightWeekOut(BaseModel):
    id: int
    week_number: int
    status: str
    day_logs: List[WeightDayLogOut] = []
    average_weight: Optional[float] = None

    class Config:
        from_attributes = True


class WeightCycleOut(BaseModel):
    id: int
    start_weight: float
    months: int
    status: str
    created_at: datetime
    weeks: List[WeightWeekOut] = []

    class Config:
        from_attributes = True


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardOut(BaseModel):
    current_plan: Optional[dict] = None
    plan_progress: Optional[dict] = None
    last_workout: Optional[dict] = None
    quick_stats: dict = {}
    weight_panel: Optional[dict] = None
    next_workout: Optional[dict] = None
    recent_workouts: List[dict] = []
    best_progress: Optional[dict] = None
    streak: int = 0
