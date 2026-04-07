from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth, plans, weight, dashboard
from app.config import settings

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="GymTracker API", version="1.0.0")

# Build allowed origins: always include local dev, add production URL when set
_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]
if settings.FRONTEND_URL:
    _origins.append(settings.FRONTEND_URL.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
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
