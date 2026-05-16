"""
models/user.py - Users Table
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    candidate = "candidate"
    recruiter = "recruiter"
    admin = "admin"


class ApprovalStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.candidate, nullable=False)

    # CNIC — unique national ID (format: 00000-0000000-0)
    cnic = Column(String(20), unique=True, nullable=True, index=True)

    # Recruiter-specific fields
    company_name = Column(String(200), nullable=True)
    company_email = Column(String(200), nullable=True)
    justification = Column(Text, nullable=True)  # Why they want to join as recruiter
    rejection_reason = Column(Text, nullable=True) # Admin feedback if rejected

    # Approval: recruiters start "pending"; candidates/admins auto "approved"
    approval_status = Column(
        Enum(ApprovalStatus),
        default=ApprovalStatus.approved,
        nullable=False
    )

    # Candidate profile fields
    skills = Column(Text, nullable=True)       # comma-separated or JSON
    education = Column(Text, nullable=True)    # free text / JSON
    experience = Column(Text, nullable=True)   # free text / JSON
    cv_text = Column(Text, nullable=True)      # raw text extracted from CV

    is_active = Column(Boolean, default=True) # Active by default once created (post-verification)
    otp_code = Column(String(6), nullable=True)
    otp_expires_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    interviews = relationship("Interview", back_populates="user", foreign_keys="Interview.user_id")
    posted_jobs = relationship("Job", back_populates="recruiter", foreign_keys="Job.recruiter_id")
    applications = relationship("Application", back_populates="candidate", foreign_keys="Application.candidate_id")

    def __repr__(self):
        return f"<User id={self.id} email={self.email} role={self.role}>"


class PendingUser(Base):
    """
    Temporary table to store user registration data BEFORE verification.
    The actual User row is only created after OTP is verified.
    """
    __tablename__ = "pending_users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    cnic = Column(String(20), nullable=True)

    # Recruiter-specific fields
    company_name = Column(String(200), nullable=True)
    company_email = Column(String(200), nullable=True)
    justification = Column(Text, nullable=True)

    otp_code = Column(String(6), nullable=False)
    otp_expires_at = Column(DateTime(timezone=True), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
