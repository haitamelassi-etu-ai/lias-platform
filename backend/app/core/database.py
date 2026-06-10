from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings


def _database_url() -> str:
    if settings.database_url.startswith("postgres://"):
        return settings.database_url.replace("postgres://", "postgresql://", 1)
    return settings.database_url


database_url = _database_url()
connect_args = (
    {"check_same_thread": False} if database_url.startswith("sqlite") else {}
)
engine = create_engine(database_url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
