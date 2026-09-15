"""Application configuration."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    SERVICE_NAME: str = "{{projectName}}"
    SERVICE_VERSION: str = "0.1.0"
    NODE_ENV: str = "development"
    PORT: int = 8000
    
    DATABASE_URL: str = "postgresql://localhost/{{projectName}}"
    
    CORS_ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]
    
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
