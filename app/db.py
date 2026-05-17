import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session


class Base(DeclarativeBase):
    pass


def _project_root() -> Path:
    # app/db.py -> parents[1] is repo root (contains app/, frontend/, …)
    return Path(__file__).resolve().parents[1]


def _db_url() -> str:
    # Explicit URL always wins (Postgres, custom path, etc.).
    explicit = (os.getenv("DATABASE_URL") or "").strip()
    if explicit:
        return explicit

    # SQLite defaults: keep existing installs working after the Varta rebrand.
    # If `samvaad.db` exists (legacy), use it so businesses/messages still show.
    # Otherwise use `varta.db` for new projects.
    root = _project_root()
    legacy = root / "samvaad.db"
    varta = root / "varta.db"
    if legacy.exists():
        return f"sqlite:///{legacy.as_posix()}"
    return f"sqlite:///{varta.as_posix()}"


_DATABASE_URL = _db_url()
engine = create_engine(
    _DATABASE_URL,
    connect_args={"check_same_thread": False} if _DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db():
    """
    FastAPI dependency: yields a SQLAlchemy Session.
    Must be a plain generator (not @contextmanager).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_session() -> Session:
    """
    Utility for non-dependency usage (scripts/background tasks).
    """
    return SessionLocal()
