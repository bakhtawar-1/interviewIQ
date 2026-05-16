"""
api/auth.py - Authentication Endpoints
========================================
POST /api/auth/register  → Create new account
POST /api/auth/login     → Get JWT token
GET  /api/auth/me        → Get current user profile
"""

from datetime import datetime, timedelta, timezone
import random
import string
import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole, ApprovalStatus, PendingUser
from app.schemas.user import (
    UserCreate, UserLogin, UserOut, Token, VerifyOTP, ResendOTP, 
    RegistrationResponse, ForgotPasswordRequest, ResetPasswordRequest
)
from app.utils.security import hash_password, verify_password, create_access_token
from app.utils.helpers import get_current_user
from app.utils.notifications import (
    notify_admin_new_recruiter, 
    notify_otp_verification,
    notify_forgot_password
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=RegistrationResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user account.
    - Candidates: CNIC must be unique
    - Recruiters: go into "pending approval" state; admin must approve before login works
    """
    # 1. Check email uniqueness
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # 2. CNIC duplicate check (required for candidates and recruiters)
    if user_data.cnic:
        if db.query(User).filter(User.cnic == user_data.cnic).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this CNIC already exists. If this is you, please sign in."
            )
    elif user_data.role in (UserRole.candidate, UserRole.recruiter):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CNIC is required for candidates and recruiters."
        )

    # 4. Generate OTP
    otp_code = "".join(random.choices(string.digits, k=6))
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)

    # 5. Create Pending User (temporary)
    # Delete any existing pending registration for this email
    db.query(PendingUser).filter(PendingUser.email == user_data.email).delete()

    new_pending = PendingUser(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
        cnic=user_data.cnic,
        company_name=user_data.company_name,
        company_email=user_data.company_email,
        justification=user_data.justification,
        otp_code=otp_code,
        otp_expires_at=otp_expiry
    )
    db.add(new_pending)
    db.commit()
    db.refresh(new_pending)

    # 6. Send OTP Verification Email
    try:
        notify_otp_verification(new_pending.email, new_pending.full_name, otp_code)
    except Exception as e:
        print(f"OTP Email failed: {e}")

    # 7. Helper for development: return OTP in response if DEBUG=True
    resp_data = {
        "id": 0, 
        "email": new_pending.email, 
        "full_name": new_pending.full_name, 
        "role": new_pending.role,
        "message": "Registration initiated. Please verify your email."
    }
    if os.getenv("DEBUG", "false").lower() == "true":
        resp_data["debug_otp"] = otp_code

    return resp_data


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login — returns a JWT token on success.
    Recruiters with pending approval cannot log in.
    """
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your email is not verified. Please verify your account using the OTP sent to your email."
        )

    # Recruiters must be approved before they can log in
    if user.role == UserRole.recruiter and user.approval_status == ApprovalStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your recruiter account is pending admin approval. You will receive an email once approved."
        )

    if user.role == UserRole.recruiter and user.approval_status == ApprovalStatus.rejected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your recruiter account registration was not approved. Please contact support."
        )

    token = create_access_token(data={
        "user_id": user.id,
        "email": user.email,
        "role": user.role.value
    })

    return {"access_token": token, "token_type": "bearer"}


@router.post("/verify-otp")
def verify_otp(data: VerifyOTP, db: Session = Depends(get_db)):
    """Verify email via OTP and create the permanent user account."""
    pending = db.query(PendingUser).filter(PendingUser.email == data.email).first()
    if not pending:
        # Check if already verified
        if db.query(User).filter(User.email == data.email).first():
            return {"message": "Account already verified."}
        raise HTTPException(status_code=404, detail="Registration request not found or expired.")

    if pending.otp_code != data.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP code.")

    if datetime.now(timezone.utc) > (pending.otp_expires_at.replace(tzinfo=timezone.utc) if pending.otp_expires_at.tzinfo is None else pending.otp_expires_at):
        raise HTTPException(status_code=400, detail="OTP code has expired.")

    # Determine approval status for the real account
    approval = ApprovalStatus.pending if pending.role == UserRole.recruiter else ApprovalStatus.approved

    # Create the real user
    new_user = User(
        email=pending.email,
        full_name=pending.full_name,
        hashed_password=pending.hashed_password,
        role=pending.role,
        cnic=pending.cnic,
        company_name=pending.company_name,
        company_email=pending.company_email,
        justification=pending.justification,
        approval_status=approval,
        is_active=True
    )
    db.add(new_user)
    
    # Delete the pending record
    db.delete(pending)
    db.commit()
    db.refresh(new_user)

    # Notify admin if recruiter just verified their email
    if new_user.role == UserRole.recruiter:
        try:
            from app.utils.notifications import notify_admin_new_recruiter
            admin_email = os.getenv("ADMIN_EMAIL", "admin@interviewiq.com")
            notify_admin_new_recruiter(
                admin_email=admin_email,
                recruiter_name=new_user.full_name,
                recruiter_email=new_user.email,
                company=new_user.company_name or "",
            )
        except Exception:
            pass

    return {"message": "Email verified successfully! You can now log in."}


@router.post("/resend-otp")
def resend_otp(data: ResendOTP, db: Session = Depends(get_db)):
    """Generate and send a new OTP for a pending registration."""
    pending = db.query(PendingUser).filter(PendingUser.email == data.email).first()
    if not pending:
        if db.query(User).filter(User.email == data.email).first():
            raise HTTPException(status_code=400, detail="Account already verified.")
        raise HTTPException(status_code=404, detail="Registration request not found.")

    otp_code = "".join(random.choices(string.digits, k=6))
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)

    pending.otp_code = otp_code
    pending.otp_expires_at = otp_expiry
    db.commit()

    try:
        notify_otp_verification(pending.email, pending.full_name, otp_code)
    except Exception as e:
        print(f"Resend OTP Email failed: {e}")

    resp = {"message": "A new OTP code has been sent to your email."}
    if os.getenv("DEBUG", "false").lower() == "true":
        resp["debug_otp"] = otp_code
    return resp


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Request a password reset OTP."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        # Don't reveal if user exists or not for security, but we'll be helpful here for dev
        raise HTTPException(status_code=404, detail="No account found with this email.")

    otp_code = "".join(random.choices(string.digits, k=6))
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)

    user.otp_code = otp_code
    user.otp_expires_at = otp_expiry
    db.commit()

    try:
        notify_forgot_password(user.email, user.full_name, otp_code)
    except Exception as e:
        print(f"Forgot Password Email failed: {e}")

    resp = {"message": "A password reset code has been sent to your email."}
    if os.getenv("DEBUG", "false").lower() == "true":
        resp["debug_otp"] = otp_code
    return resp


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using OTP."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if not user.otp_code or user.otp_code != data.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP code.")

    # Expiry check (same logic fix as verify-otp)
    expiry = user.otp_expires_at.replace(tzinfo=timezone.utc) if user.otp_expires_at.tzinfo is None else user.otp_expires_at
    if datetime.now(timezone.utc) > expiry:
        raise HTTPException(status_code=400, detail="OTP code has expired.")

    user.hashed_password = hash_password(data.new_password)
    user.otp_code = None
    user.otp_expires_at = None
    db.commit()

    return {"message": "Password reset successfully. You can now log in with your new password."}


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Get currently logged-in user's profile."""
    return current_user
