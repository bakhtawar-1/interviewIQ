"""
api/auth.py - Authentication Endpoints
========================================
Two endpoints:
  POST /api/auth/register  → Create new account
  POST /api/auth/login     → Get JWT token

HOW REGISTRATION WORKS:
1. Receive email, name, password
2. Check email isn't already taken
3. Hash the password
4. Save user to DB
5. Return user info (no password!)

HOW LOGIN WORKS:
1. Receive email + password
2. Find user by email
3. Verify password against hash
4. Create JWT token
5. Return token
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserOut, Token
from app.utils.security import hash_password, verify_password, create_access_token

# APIRouter = a group of related endpoints
# We add this to main.py with a prefix like "/api/auth"
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user account.
    
    - Receives: { email, full_name, password, role }
    - Returns: User info (no password)
    - Errors: 400 if email already exists
    """
    # Check if email is already taken
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # Hash the password before saving
    hashed = hash_password(user_data.password)

    # Create the User object (not saved to DB yet)
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed,
        role=user_data.role
    )

    # Save to database
    db.add(new_user)
    db.commit()           # Actually write to PostgreSQL
    db.refresh(new_user)  # Get the auto-generated id and timestamps

    return new_user  # Pydantic UserOut schema filters out hashed_password


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login with email and password. Returns a JWT access token.
    
    - Receives: { email, password }
    - Returns: { access_token, token_type }
    - Errors: 401 if credentials are wrong
    
    The client should store this token and send it as:
    Header: "Authorization: Bearer <access_token>"
    """
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()

    # Check user exists AND password is correct
    # We combine both checks into one error message for security
    # (Don't tell attackers if the email exists or not!)
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account has been deactivated. Contact admin."
        )

    # Create JWT token — store identifying info inside it
    token = create_access_token(data={
        "user_id": user.id,
        "email": user.email,
        "role": user.role.value
    })

    return {"access_token": token, "token_type": "bearer"}


# ── /me endpoint — returns logged-in user's profile ──────────────────────────
from app.utils.helpers import get_current_user as _get_current_user

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(_get_current_user)):
    """Get currently logged-in user's profile."""
    return current_user
