from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.database import Base, SessionLocal, engine
from .routers import (
    audit,
    auth,
    axes,
    communications,
    contact,
    dashboard,
    events,
    exports,
    gallery,
    members,
    moderation,
    news,
    orcid,
    projects,
    publications,
)
from .seed import seed_database

app = FastAPI(
    title=settings.app_name,
    docs_url="/docs" if settings.docs_enabled else None,
    redoc_url="/redoc" if settings.docs_enabled else None,
    openapi_url="/openapi.json" if settings.docs_enabled else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


@app.on_event("startup")
def on_startup() -> None:
    if settings.auto_create_tables:
        Base.metadata.create_all(bind=engine)
    if settings.auto_seed:
        with SessionLocal() as db:
            seed_database(db)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "LIAS platform backend is running"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(audit.router, prefix=settings.api_prefix)
app.include_router(members.router, prefix=settings.api_prefix)
app.include_router(axes.router, prefix=settings.api_prefix)
app.include_router(publications.router, prefix=settings.api_prefix)
app.include_router(communications.router, prefix=settings.api_prefix)
app.include_router(projects.router, prefix=settings.api_prefix)
app.include_router(events.router, prefix=settings.api_prefix)
app.include_router(news.router, prefix=settings.api_prefix)
app.include_router(dashboard.router, prefix=settings.api_prefix)
app.include_router(moderation.router, prefix=settings.api_prefix)
app.include_router(orcid.router, prefix=settings.api_prefix)
app.include_router(exports.router, prefix=settings.api_prefix)
app.include_router(contact.router, prefix=settings.api_prefix)
app.include_router(gallery.router, prefix=settings.api_prefix)
