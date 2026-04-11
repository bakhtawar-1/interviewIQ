"""
database.py - Database Connection
===================================
This file sets up the connection to PostgreSQL using SQLAlchemy.

HOW IT WORKS:
1. create_engine() - creates the connection to PostgreSQL
2. SessionLocal - a factory that creates new DB sessions
3. Base - all your models (tables) inherit from this
4. get_db() - a "dependency" FastAPI uses to give each request its own DB session

IMPORTANT CONCEPT — Sessions:
Think of a session like a shopping cart. You open it, do your work
(add/update/delete rows), then either COMMIT (save) or ROLLBACK (undo).
Each API request gets its own session and it's closed when the request ends.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# 1. Create the engine — this is the actual connection to PostgreSQL
engine = create_engine(
    settings.DATABASE_URL,
    # pool_pre_ping checks if connection is alive before using it
    pool_pre_ping=True
)

# 2. SessionLocal — calling SessionLocal() gives you a new DB session
SessionLocal = sessionmaker(
    autocommit=False,  # Don't auto-save — we control when to commit
    autoflush=False,   # Don't auto-send SQL to DB — we control this too
    bind=engine        # Use our PostgreSQL engine
)

# 3. Base — all your SQLAlchemy models will inherit from this
Base = declarative_base()


# 4. get_db() — FastAPI "dependency injection"
# Every endpoint that needs DB access will use this
def get_db():
    """
    Yields a database session for each request.
    The 'finally' block ensures the session ALWAYS closes,
    even if an error occurs — preventing connection leaks.
    """
    db = SessionLocal()
    try:
        yield db      # Give the session to the endpoint
    finally:
        db.close()    # Always close when request is done
