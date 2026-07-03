import os
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "SOP Expert AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # OpenRouter / OpenAI settings
    OPENAI_API_KEY: str = ""
    OPENAI_API_BASE: str = "https://openrouter.ai/api/v1"
    OPENAI_LLM_MODEL: str = "gpt-4o-mini"
    OPENAI_REFERER: str = "https://sop-expert-ai.vercel.app"
    OPENAI_APP_TITLE: str = "SOP Expert AI"

    # Embedding settings (uses local model via fastembed - free, no API key needed)
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"

    # Supported models
    SUPPORTED_LLM_MODELS: List[str] = [
        "gpt-4o-mini",
        "gpt-4o",
        "gpt-4-turbo",
        "gpt-3.5-turbo",
    ]

    # File upload settings
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    MAX_UPLOAD_SIZE_MB: int = 50
    MAX_UPLOAD_SIZE_BYTES: int = MAX_UPLOAD_SIZE_MB * 1024 * 1024
    SUPPORTED_EXTENSIONS: List[str] = [".pdf", ".docx", ".txt", ".md"]

    # ChromaDB settings
    CHROMA_PERSIST_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")
    CHROMA_COLLECTION_NAME: str = "sop_documents"

    # Chunk settings
    CHUNK_SIZE: int = 600
    CHUNK_OVERLAP: int = 100

    # Retriever settings
    RETRIEVER_K: int = 2

    # Database
    DATABASE_URL: str = "sqlite:///./sop_expert.db"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://*.vercel.app"]

    # Chat settings
    TEMPERATURE: float = 0.1
    MAX_TOKENS: int = 512

    # Auth settings
    JWT_SECRET_KEY: str = "change-this-to-a-secure-random-secret-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # Admin settings
    ADMIN_EMAIL: str = "habib@example.com"

    # Email / SMTP settings (for password reset)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
