"""
models/user.py - Users Table
==============================
This defines what the 'users' table looks like in PostgreSQL.
SQLAlchemy will CREATE this table for you — you don't write SQL!

ROLES EXPLAINED:
- candidate  → job seekers who practice interviews
- recruiter  → HR people who review candidates
- admin      → you (the developer/admin)
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.database import Base


# Python Enum for user roles — prevents typos like "Candidate" vs "candidate"
class UserRole(str, enum.Enum):
    candidate = "candidate"
    recruiter = "recruiter"
    admin = "admin"


class User(Base):
    """
    Represents the 'users' table in PostgreSQL.
    Each attribute = one column in the table.
    """
    __tablename__ = "users"  # This is the actual table name in PostgreSQL

    # Primary key — auto-increments (1, 2, 3, ...)
    id = Column(Integer, primary_key=True, index=True)

    # Email — unique so two users can't use the same email
    email = Column(String, unique=True, index=True, nullable=False)

    # Full name
    full_name = Column(String, nullable=False)

    # Hashed password — NEVER store plain text passwords!
    # We store something like: "$2b$12$abc123..." (bcrypt hash)
    hashed_password = Column(String, nullable=False)

    # Role: candidate, recruiter, or admin
    role = Column(Enum(UserRole), default=UserRole.candidate, nullable=False)

    # Is the account active? (Use this to "soft delete" instead of actually deleting)
    is_active = Column(Boolean, default=True)

    # Timestamps — func.now() = current time in PostgreSQL
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships — this lets you do: user.interviews to get all interviews
    # "back_populates" links the two sides of the relationship
    interviews = relationship("Interview", back_populates="user")

    def __repr__(self):
        return f"<User id={self.id} email={self.email} role={self.role}>"
