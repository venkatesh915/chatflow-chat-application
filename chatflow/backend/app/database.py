import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("chatflow.database")

Base = declarative_base()

def get_engine(db_url: str):
    connect_args = {}
    if db_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    return create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)

# Primary target: PostgreSQL from settings.DATABASE_URL
# Fallback to local SQLite if PostgreSQL credentials/db need configuration by user in development
db_url = settings.DATABASE_URL
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

try:
    engine = get_engine(db_url)
    with engine.connect() as conn:
        pass
    print(f"[ChatFlow Database] Successfully connected to primary database: {db_url.split('@')[-1] if '@' in db_url else db_url}")
except Exception as e:
    print(f"[ChatFlow Database] Note: Primary database ({db_url.split('@')[-1] if '@' in db_url else db_url}) not reachable: {e}")
    import os
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sqlite_path = os.path.join(backend_dir, "chatflow.db").replace("\\", "/")
    print(f"[ChatFlow Database] Using local SQLite database (sqlite:///{sqlite_path}). To use PostgreSQL, verify credentials in backend/.env")
    db_url = f"sqlite:///{sqlite_path}"
    engine = get_engine(db_url)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def run_migrations(target_engine):
    """Safely adds newly required columns to existing tables if they don't already exist."""
    from sqlalchemy import text
    cols_to_add = [
        ("messages", "status", "VARCHAR(20) DEFAULT 'sent'"),
        ("messages", "delivered_at", "TIMESTAMP NULL"),
        ("messages", "read_at", "TIMESTAMP NULL"),
        ("attachments", "duration", "INTEGER NULL"),
    ]
    with target_engine.connect() as conn:
        for table, col, col_type in cols_to_add:
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type};"))
                conn.commit()
                print(f"[ChatFlow Migration] Added column {col} to {table}.")
            except Exception:
                pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
