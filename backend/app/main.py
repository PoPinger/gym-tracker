from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.config import settings
from app.database import Base, engine
from app.routers import auth, plans, weight, dashboard, admin, push

# Create all tables on startup
Base.metadata.create_all(bind=engine)

# create_all doesn't add columns to existing tables — add new ones idempotently
with engine.begin() as conn:
    conn.execute(text("ALTER TABLE exercises ADD COLUMN IF NOT EXISTS rep_min INTEGER"))
    conn.execute(text("ALTER TABLE exercises ADD COLUMN IF NOT EXISTS rep_max INTEGER"))
    conn.execute(text("ALTER TABLE exercises ADD COLUMN IF NOT EXISTS rest_seconds INTEGER"))
    conn.execute(text("ALTER TABLE exercises ADD COLUMN IF NOT EXISTS note TEXT"))
    conn.execute(text("ALTER TABLE set_logs ADD COLUMN IF NOT EXISTS rir INTEGER"))
    conn.execute(text("ALTER TABLE training_day_logs ADD COLUMN IF NOT EXISTS workout_date DATE"))
    conn.execute(text("ALTER TABLE training_day_logs ADD COLUMN IF NOT EXISTS skipped BOOLEAN NOT NULL DEFAULT FALSE"))
    conn.execute(text("ALTER TABLE exercise_logs ADD COLUMN IF NOT EXISTS skipped BOOLEAN NOT NULL DEFAULT FALSE"))
    conn.execute(text("ALTER TABLE training_weeks ADD COLUMN IF NOT EXISTS is_deload BOOLEAN NOT NULL DEFAULT FALSE"))
    conn.execute(text("ALTER TABLE plan_days ADD COLUMN IF NOT EXISTS color VARCHAR(20)"))
    conn.execute(text("ALTER TABLE weight_cycles ADD COLUMN IF NOT EXISTS goal VARCHAR(10)"))
    conn.execute(text("ALTER TABLE weight_cycles ALTER COLUMN start_weight DROP NOT NULL"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS mascot VARCHAR(20)"))
    # ADMIN_EMAIL is the single source of truth for the admin role
    conn.execute(
        text("UPDATE users SET is_admin = (LOWER(email) = LOWER(:email) AND :email <> '')"),
        {"email": settings.ADMIN_EMAIL.strip()},
    )

app = FastAPI(title="GymTracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(plans.router)
app.include_router(weight.router)
app.include_router(dashboard.router)
app.include_router(admin.router)
app.include_router(push.router)


@app.get("/health")
def health():
    return {"status": "ok"}
