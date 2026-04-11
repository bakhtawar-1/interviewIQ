"""
utils/security.py - Password Hashing + JWT Tokens
====================================================
Two responsibilities:

1. PASSWORD HASHING
   - Never store plain passwords in the DB!
   - We use bcrypt (passlib) to hash: "mypassword" → "$2b$12$abc..."
   - Hashing is ONE-WAY — you can't reverse it
   - To verify: hash the input again and compare

2. JWT TOKENS (JSON Web Tokens)
   - After login, we give the user a "token" (long encoded string)
   - They include this token in every future request
   - We decode it to know WHO is making the request
   - Tokens expire (set in .env — default 30 minutes)

JWT STRUCTURE (3 parts separated by dots):
   header.payload.signature
   - Header: algorithm info
   - Payload: the data we stored (user_id, email, role)
   - Signature: proves it wasn't tampered with
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings

# ─── Password Hashing ────────────────────────────────────────────────────────

# CryptContext handles all the hashing details for us
# "bcrypt" is the gold standard for password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """
    Convert plain text password to a bcrypt hash.
    Example: "hello123" → "$2b$12$..."
    ALWAYS use this before saving a password to the database.
    """
    return pwd_context.hash(plain_password[:72])


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Check if a plain password matches a stored hash.
    Returns True if they match, False otherwise.
    Used during login to verify the password the user typed.
    """
    return pwd_context.verify(plain_password[:72], hashed_password)


# ─── JWT Token Functions ─────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT token containing 'data'.
    
    data example: {"user_id": 1, "email": "user@example.com", "role": "candidate"}
    
    The token expires after ACCESS_TOKEN_EXPIRE_MINUTES (from .env)
    Returns the encoded token string to send to the client.
    """
    to_encode = data.copy()

    # Set expiry time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})  # "exp" is a standard JWT claim for expiry

    # Encode with our secret key and algorithm
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode a JWT token and return the data inside it.
    Returns None if token is invalid or expired.
    
    FastAPI endpoints use this to know who's making the request.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None  # Token is invalid or expired
