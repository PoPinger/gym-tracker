from typing import Literal, Optional, List
from datetime import date, datetime
from pydantic import BaseModel, EmailStr, field_validator, model_validator


# ── Auth ──────────────────────────────────────────────────────────────────────

PASSWORD_MIN_LENGTH = 8


def _check_password_length(v: str) -> str:
    if len(v) < PASSWORD_MIN_LENGTH:
        raise ValueError(f"Hasło musi mieć co najmniej {PASSWORD_MIN_LENGTH} znaków")
    return v


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        return _check_password_length(v)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    display_name: Optional[str]
    is_admin: bool = False


class UserOut(BaseModel):
    id: int
    email: str
    display_name: Optional[str]
    created_at: datetime
    is_admin: bool = False

    class Config:
        from_attributes = True


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v):
        return _check_password_length(v)


class ResetVerifyRequest(BaseModel):
    email: str          # plain str: a malformed e-mail must get the same generic error
    code: str


class ResetVerifyResponse(BaseModel):
    reset_token: str


class ResetCompleteRequest(BaseModel):
    reset_token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v):
        return _check_password_length(v)


# ── Admin ─────────────────────────────────────────────────────────────────────

class AdminUserOut(BaseModel):
    id: int
    email: str
    display_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ResetCodeOut(BaseModel):
    code: str
    expires_at: datetime


# ── Plans ─────────────────────────────────────────────────────────────────────

# Training day colour keys (must match frontend/src/utils/dayColors.ts)
DAY_COLORS = {"indigo", "blue", "sky", "teal", "green", "lime", "amber", "orange", "red", "pink"}


class DayColorMixin(BaseModel):
    color: Optional[str] = None

    @field_validator("color")
    @classmethod
    def validate_color(cls, v):
        if v is not None and v not in DAY_COLORS:
            raise ValueError("Nieznany kolor dnia")
        return v


class RepRangeMixin(BaseModel):
    rep_min: Optional[int] = None
    rep_max: Optional[int] = None

    @model_validator(mode="after")
    def validate_rep_range(self):
        if (self.rep_min is None) != (self.rep_max is None):
            raise ValueError("Podaj oba końce zakresu powtórzeń albo żaden")
        if self.rep_min is not None:
            if not (1 <= self.rep_min <= 100 and 1 <= self.rep_max <= 100):
                raise ValueError("Zakres powtórzeń musi mieścić się w przedziale 1–100")
            if self.rep_min > self.rep_max:
                raise ValueError("Minimalna liczba powtórzeń nie może być większa niż maksymalna")
        return self


class ExerciseEditItem(RepRangeMixin):
    id: Optional[int] = None   # None = new exercise
    name: str
    muscle_group: str
    sets: int
    exercise_order: int = 0


class PlanDayEdit(DayColorMixin):
    id: int
    day_name: str
    exercises: List[ExerciseEditItem] = []


class PlanStructureUpdate(BaseModel):
    name: str
    days: List[PlanDayEdit] = []


class ExerciseCreate(RepRangeMixin):
    name: str
    muscle_group: str
    sets: int
    exercise_order: int = 0


class ExerciseOut(BaseModel):
    id: int
    name: str
    muscle_group: str
    sets: int
    rep_min: Optional[int] = None
    rep_max: Optional[int] = None
    exercise_order: int

    class Config:
        from_attributes = True


class ExerciseUpdate(BaseModel):
    name: Optional[str] = None
    muscle_group: Optional[str] = None
    sets: Optional[int] = None
    exercise_order: Optional[int] = None


class PlanDayCreate(DayColorMixin):
    day_name: str
    day_order: int
    exercises: List[ExerciseCreate] = []


class PlanDayOut(BaseModel):
    id: int
    day_name: str
    day_order: int
    color: Optional[str] = None
    exercises: List[ExerciseOut] = []

    class Config:
        from_attributes = True


class PlanDayUpdate(DayColorMixin):
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


class PlanDaySummary(BaseModel):
    day_name: str
    color: Optional[str] = None

    class Config:
        from_attributes = True


class PlanSummary(BaseModel):
    id: int
    name: str
    days_per_week: int
    months: int
    status: str
    created_at: datetime
    completed_weeks: int = 0
    days: List[PlanDaySummary] = []

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
    skipped: bool = False
    set_logs: List[SetLogOut] = []

    class Config:
        from_attributes = True


class DayLogCreate(BaseModel):
    plan_day_id: int
    training_week_id: int


class DayCompleteIn(BaseModel):
    workout_date: Optional[date] = None
    skipped: Optional[bool] = None


class DayLogOut(BaseModel):
    id: int
    training_week_id: int
    plan_day_id: int
    status: str
    completed_at: Optional[datetime]
    workout_date: Optional[date] = None
    skipped: bool = False
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

WeightGoal = Literal["bulk", "cut"]


class WeightCycleCreate(BaseModel):
    months: int
    goal: WeightGoal
    start_weight: Optional[float] = None

    @field_validator("months")
    @classmethod
    def months_range(cls, v):
        if not 1 <= v <= 12:
            raise ValueError("Liczba miesięcy musi wynosić od 1 do 12")
        return v

    @field_validator("start_weight")
    @classmethod
    def weight_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Waga musi być większa od zera")
        return v


class WeightCycleUpdate(BaseModel):
    goal: Optional[WeightGoal] = None
    months: Optional[int] = None

    @field_validator("months")
    @classmethod
    def months_range(cls, v):
        if v is not None and not 1 <= v <= 12:
            raise ValueError("Liczba miesięcy musi wynosić od 1 do 12")
        return v

    @model_validator(mode="after")
    def not_empty(self):
        if self.goal is None and self.months is None:
            raise ValueError("Podaj cel lub liczbę miesięcy")
        return self


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
    start_weight: Optional[float] = None
    months: int
    status: str
    goal: Optional[str] = None
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
    workout_calendar: List[dict] = []
    best_progress: Optional[dict] = None
    streak: int = 0
