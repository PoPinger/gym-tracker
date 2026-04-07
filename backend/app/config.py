# Stack choice: FastAPI + PostgreSQL + React + TypeScript
# Rationale: FastAPI gives async performance + auto docs, PostgreSQL is production-grade relational,
# React+TS is industry standard for modern SPAs. Clean separation, great for portfolio/GitHub.

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    class Config:
        env_file = ".env"


settings = Settings()
