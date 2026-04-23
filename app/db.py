import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session


class Base(DeclarativeBase):
    pass


def _db_url() -> str:
    # Default: local SQLite DB file in project root.
    # Can be overridden with DATABASE_URL (e.g. Postgres).
    return os.getenv("DATABASE_URL", "sqlite:///./samvaad.db")


engine = create_engine(
    _db_url(),
    connect_args={"check_same_thread": False} if _db_url().startswith("sqlite") else {},
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

