import datetime
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session, joinedload
from app.config import SECRET_KEY, ALGORITHM
from app.database import get_db
from app.models.models import User, Role

import bcrypt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> tuple[bool, bool]:
    """
    Returns (is_valid, needs_rehash).
    Smooth transition: Validates legacy 'plain:' passwords and flags them for immediate bcrypt upgrade.
    Uses native bcrypt to ensure compatibility with modern bcrypt and Python 3.14.
    """
    if not hashed_password or not plain_password:
        return False, False
        
    if hashed_password.startswith("plain:"):
        is_valid = (hashed_password == f"plain:{plain_password}")
        return is_valid, True if is_valid else False
    
    try:
        plain_bytes = plain_password.encode('utf-8')[:72]
        hash_bytes = hashed_password.encode('utf-8')
        is_valid = bcrypt.checkpw(plain_bytes, hash_bytes)
        return is_valid, False
    except Exception:
        return False, False

def get_password_hash(password: str) -> str:
    plain_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(plain_bytes, salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(days=1)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).options(
        joinedload(User.roles),
        joinedload(User.student_profile),
        joinedload(User.faculty_profile)
    ).filter(User.username == username).first()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is inactive or does not exist."
        )
    return user

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        user_role_names = [role.name for role in current_user.roles]
        if not any(role in user_role_names for role in allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {allowed_roles}"
            )
        return current_user
    return role_checker

