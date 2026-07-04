import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import router
from app.api.auth import router as auth_router
from app.api.admin import router as admin_router
from app.utils.helpers import setup_logging

logger = setup_logging()
logger.info(f"CORS origins: {settings.CORS_ORIGINS}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    from app.models.domain import Base
    from app.database import engine, run_migrations
    Base.metadata.create_all(bind=engine)
    run_migrations()
    logger.info("Database tables created")
    yield
    logger.info(f"Shutting down {settings.APP_NAME}")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered SOP Knowledge Assistant",
    lifespan=lifespan,
)

logger.info(f"CORS origins: {settings.CORS_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],

app.include_router(auth_router, prefix="/api")
app.include_router(router, prefix="/api")
app.include_router(admin_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
    }
