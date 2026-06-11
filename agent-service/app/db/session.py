"""Database session management."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import get_settings

settings = get_settings()
DSN = settings.agent_db_dsn

engine = create_engine(DSN, pool_pre_ping=True, pool_size=5)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db():
    """Yield a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
