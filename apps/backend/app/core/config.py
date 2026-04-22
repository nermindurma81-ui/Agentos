from pydantic import BaseModel
import os


class Settings(BaseModel):
    app_name: str = "AgentixOS Backend"
    database_url: str = os.getenv("DATABASE_URL", "postgresql+psycopg://agentixos:agentixos@postgres:5432/agentixos")
    redis_url: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    minio_endpoint: str = os.getenv("MINIO_ENDPOINT", "minio:9000")
    minio_access_key: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    minio_secret_key: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    minio_bucket: str = os.getenv("MINIO_BUCKET", "agentixos")
    polinations_url: str = os.getenv("POLINATIONS_URL", "https://text.pollinations.ai")


settings = Settings()
