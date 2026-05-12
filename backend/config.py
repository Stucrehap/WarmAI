from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # 应用配置
    APP_NAME: str = "AI Campus Dating System"
    DEBUG: bool = True

    # 数据库配置
    DATABASE_URL: str = "sqlite:///../data/campus_dating.db"

    # JWT配置
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # AI API配置
    AI_API_KEY: Optional[str] = None
    AI_API_BASE: str = "https://api.openai.com/v1"
    AI_MODEL: str = "gpt-3.5-turbo"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
