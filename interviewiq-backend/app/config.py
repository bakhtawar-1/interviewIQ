"""
config.py - Configuration Settings
===================================
This file reads all settings from the .env file.
Pydantic automatically validates the types (e.g., int, str).
If a required variable is missing from .env, the app will CRASH
on startup with a clear error — which is good, catch it early!
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "InterviewIQ"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str  # Required — must be in .env

    # Security
    SECRET_KEY: str     # Required — must be in .env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"      # Tell pydantic to read from .env
        case_sensitive = True  # DATABASE_URL != database_url


# Create one global settings object — import this everywhere
settings = Settings()
