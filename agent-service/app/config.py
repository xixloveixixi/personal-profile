"""Agent Service Configuration."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # DeepSeek API
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com/v1"
    deepseek_model: str = "deepseek-chat"

    # Database
    database_url: str = "mysql+pymysql://pp_app:pp_dev_pwd@localhost:3306/personal_profile"
    agent_db_dsn: str = "mysql+pymysql://pp_app:pp_dev_pwd@127.0.0.1:3306/personal_profile?charset=utf8mb4"

    # LangGraph Checkpoint
    checkpoint_db: str = "sqlite:///checkpoints/checkpoints.db"

    # Service
    service_host: str = "0.0.0.0"
    service_port: int = 8000

    # Go Backend (for tool calls)
    backend_url: str = "http://localhost:8080"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
