from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Default to local SQLite fallback so the platform works out-of-the-box
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./platform.db"
    )
    SANDBOX_DATABASE_URL: str = Field(
        default="sqlite:///./sandbox.db"
    )
    JWT_SECRET: str = Field(
        default="super_secret_jwt_key_for_sql_assessment_platform_2026"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    GEMINI_API_KEY: Optional[str] = None
    ENVIRONMENT: str = "development"  # development, testing, production
    FRONTEND_URL: str = Field(default="http://localhost:3000")

settings = Settings()
