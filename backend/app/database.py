import os
import logging
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session as SessionType
from app.config import settings

logger = logging.getLogger(__name__)

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def run_migrations():
    """Add missing columns for existing databases (schema migration)."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("PRAGMA table_info(users)"))
            columns = {row[1] for row in result}
            if "reset_token" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN reset_token VARCHAR"))
                logger.info("Migration: added reset_token column to users table")
            if "reset_token_expires" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN reset_token_expires DATETIME"))
                logger.info("Migration: added reset_token_expires column to users table")
            if "is_admin" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0"))
                conn.execute(text("UPDATE users SET is_admin = 1 WHERE email = :admin_email"), {"admin_email": settings.ADMIN_EMAIL})
                logger.info(f"Migration: added is_admin column, set admin for {settings.ADMIN_EMAIL}")
            conn.commit()
    except Exception as e:
        logger.warning(f"Migration check failed (non-critical): {e}")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
