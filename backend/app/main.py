from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.database import Base, SessionLocal, engine
from .routers import (
    auth,
    axes,
    communications,
    dashboard,
    events,
    exports,
    members,
    moderation,
    news,
    orcid,
    projects,
    publications,
)
from .seed import seed_database

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "LIAS platform backend is running"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth.router, prefix=settings.api_prefix)
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
