"""
utils/helpers.py - Helper Functions
=====================================
Small reusable utility functions used across the app.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.security import decode_access_token
from app.models.user import User, UserRole

# OAuth2PasswordBearer tells FastAPI WHERE to find the token
# "tokenUrl" = the login endpoint that creates the token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency that extracts and validates the current logged-in user.
    
    HOW IT WORKS:
    1. FastAPI extracts the token from the "Authorization: Bearer <token>" header
    2. We decode the token to get user_id
    3. We fetch the user from DB
    4. If anything is wrong → 401 Unauthorized error
    
    Use in any endpoint like:
        def my_endpoint(current_user: User = Depends(get_current_user)):
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Decode the token
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: int = payload.get("user_id")
    if user_id is None:
        raise credentials_exception

    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    # Check account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account has been deactivated."
        )

    return user


def require_role(allowed_roles: list):
    """
    Factory function that creates a role-checking dependency.
    
    Usage:
        @router.get("/admin-only")
        def admin_endpoint(user = Depends(require_role([UserRole.admin]))):
            ...
    """
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker
