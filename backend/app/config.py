from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FRONTEND_URL: str = ""          # set to production Vercel URL on Render
    ADMIN_EMAIL: str = ""           # user with this e-mail is made admin on startup
    VAPID_PUBLIC_KEY: str = ""      # Web Push (rest timer); push is off while these are empty
    VAPID_PRIVATE_KEY: str = ""
    VAPID_SUBJECT: str = ""         # e.g. mailto:you@example.com

    class Config:
        env_file = ".env"


settings = Settings()
