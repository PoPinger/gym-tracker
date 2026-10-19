from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database import Base, engine
from app.routers import auth, plans, weight, dashboard

# Create all tables on startup
Base.metadata.create_all(bind=engine)

# create_all doesn't add columns to existing tables — add new ones idempotently
with engine.begin() as conn:
    conn.execute(text("ALTER TABLE exercises ADD COLUMN IF NOT EXISTS rep_min INTEGER"))
    conn.execute(text("ALTER TABLE exercises ADD COLUMN IF NOT EXISTS rep_max INTEGER"))
    conn.execute(text("ALTER TABLE training_day_logs ADD COLUMN IF NOT EXISTS workout_date DATE"))
    conn.execute(text("ALTER TABLE training_day_logs ADD COLUMN IF NOT EXISTS skipped BOOLEAN NOT NULL DEFAULT FALSE"))

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


@app.get("/health")
def health():
    return {"status": "ok"}
