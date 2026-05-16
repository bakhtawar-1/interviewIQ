"""
schemas/user.py - User Schemas (Pydantic)
==========================================
Defines what data goes in/out for user-related API endpoints.
"""

import re
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
from app.models.user import UserRole, ApprovalStatus


# ─── Helpers ────────────────────────────────────────────────────────────────

CNIC_PATTERN = re.compile(r"^\d{5}-\d{7}-\d$")


# ─── Input Schemas ─────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    """Used when a new user registers."""
    email: EmailStr
    full_name: str
    password: str
    role: UserRole = UserRole.candidate

    # CNIC required for candidates and recruiters
    cnic: Optional[str] = None

    # Recruiter-only fields
    company_name: Optional[str] = None
    company_email: Optional[EmailStr] = None
    justification: Optional[str] = Field(None, description="Why you want to join as a recruiter")

    @field_validator("password")
    @classmethod
    def password_must_be_strong(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("full_name")
    @classmethod
    def name_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError("Full name cannot be empty")
        return v.strip()

    @field_validator("cnic")
    @classmethod
    def validate_cnic_format(cls, v):
        if v is not None:
            v = v.strip()
            if not CNIC_PATTERN.match(v):
                raise ValueError("CNIC must be in format: 00000-0000000-0")
        return v


class UserLogin(BaseModel):
    """Used when a user logs in."""
    email: EmailStr
    password: str


class VerifyOTP(BaseModel):
    """Used to verify email via OTP."""
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)


class ResendOTP(BaseModel):
    """Used to request a new OTP."""
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    """Used when updating profile — all fields optional."""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    skills: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None


# ─── Output Schemas ─────────────────────────────────────────────────────────

class UserOut(BaseModel):
    """Safe user data to return in API responses — never includes password."""
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    cnic: Optional[str] = None
    company_name: Optional[str] = None
    company_email: Optional[EmailStr] = None
    justification: Optional[str] = None
    rejection_reason: Optional[str] = None
    approval_status: ApprovalStatus
    skills: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    cv_text: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RegistrationResponse(BaseModel):
    """Returned after initial registration, before OTP verification."""
    id: int = 0
    email: str
    full_name: str
    role: UserRole
    debug_otp: Optional[str] = None
    message: str = "OTP sent to email."


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
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Data stored INSIDE the JWT token."""
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None
