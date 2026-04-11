"""
schemas/user.py - User Schemas (Pydantic)
==========================================
Schemas are like "contracts" — they define what data is allowed IN and what
data goes OUT of your API. They are NOT the database models.

DIFFERENCE:
- Model (models/user.py) = defines the DB TABLE structure
- Schema (schemas/user.py) = defines what the API accepts/returns

WHY SEPARATE?
- You never want to return hashed_password in an API response
- You want to validate email format before it touches the DB
- Different endpoints need different shapes of user data

SCHEMA TYPES:
- UserCreate  → what you receive when someone REGISTERS
- UserLogin   → what you receive when someone LOGS IN
- UserOut     → what you RETURN (never includes password!)
- Token       → JWT token response after login
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from app.models.user import UserRole


# ─── Input Schemas (what the API receives) ─────────────────────────────────

class UserCreate(BaseModel):
    """Used when a new user registers."""
    email: EmailStr          # Pydantic validates email format automatically!
    full_name: str
    password: str            # Plain text password — we hash it in the service layer
    role: UserRole = UserRole.candidate  # Default to candidate

    @validator('password')
    def password_must_be_strong(cls, v):
        """Simple password validation."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

    @validator('full_name')
    def name_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError('Full name cannot be empty')
        return v.strip()


class UserLogin(BaseModel):
    """Used when a user logs in."""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Used when updating profile — all fields optional."""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


# ─── Output Schemas (what the API returns) ──────────────────────────────────

class UserOut(BaseModel):
    """
    Safe user data to return in API responses.
    Notice: NO hashed_password field! Never expose this.
    """
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True  # Allows converting SQLAlchemy model → this schema


class RecruiterCandidateOut(UserOut):
    """Candidate row for recruiter dashboard with screening metrics."""
    interview_count: int = 0
    completed_interview_count: int = 0
    average_score: Optional[float] = None
    job_roles: List[str] = Field(default_factory=list)


# ─── Token Schemas ──────────────────────────────────────────────────────────

class Token(BaseModel):
    """Returned after successful login."""
    access_token: str
    token_type: str = "bearer"  # Standard OAuth2 token type


class TokenData(BaseModel):
    """Data stored INSIDE the JWT token."""
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None
