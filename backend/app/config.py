import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SAT-SA (Supervisory Analytics Tool for SOC Assessment)"
    PROJECT_VERSION: str = "2.0.0-PROD"
    API_PREFIX: str = "/api"
    
    # Air-Gapped and Offline Mode
    AIR_GAPPED_MODE: bool = True
    ALLOW_EXTERNAL_CALLS: bool = False
    
    # Database URL: SQLite for zero-config offline standalone execution, PostgreSQL in Docker/Cluster
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./satsa_enterprise.db")
    
    # Security & JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "NCIIPC-SAT-SA-SECURE-KEY-AIR-GAPPED-SECRET-984321")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12-hour operational shift
    
    # Audit Logging & Ledger
    AUDIT_GENESIS_HASH: str = "0000000000000000000000000000000000000000000000000000000000000000"
    
    # File upload storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./storage/uploads")
    REPORT_DIR: str = os.getenv("REPORT_DIR", "./storage/reports")

    class Config:
        env_file = ".env"

settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORT_DIR, exist_ok=True)
