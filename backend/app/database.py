import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

logger = logging.getLogger(__name__)

# Ensure backend/.env is loaded
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(env_path)

env_db = os.getenv("NASC_DATABASE_URL") or os.getenv("DATABASE_URL", "")
direct_db = os.getenv("DIRECT_DATABASE_URL", "")

if not env_db or "corporate_assessment" in env_db:
    raise RuntimeError("DATABASE_URL is not configured in backend/.env. Please configure your Supabase connection string.")
SQLALCHEMY_DATABASE_URL = env_db

if not direct_db:
    # Derive direct connection string by replacing pooler ports (6432 or 6543) with direct/session port 5432
    DIRECT_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(":6432/", ":5432/").replace(":6543/", ":5432/")
else:
    DIRECT_DATABASE_URL = direct_db

pool_size = int(os.getenv("DB_POOL_SIZE", "9"))
max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "3"))

# Primary Engine (safely sized within Supabase 15-client limit)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=pool_size,
    max_overflow=max_overflow,
    pool_timeout=20,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"connect_timeout": 10}
)

# Direct Administrative Engine (connects directly to PostgreSQL on port 5432 for schema DDL and migrations)
direct_engine = create_engine(
    DIRECT_DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    connect_args={"connect_timeout": 15}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
DirectSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=direct_engine)
Base = declarative_base()

def get_db():
    """Standard database session dependency routing through PgCat connection pooler."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_direct_db():
    """Direct database session dependency bypassing PgCat for administrative migrations."""
    db = DirectSessionLocal()
    try:
        yield db
    finally:
        db.close()

