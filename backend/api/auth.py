from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import bcrypt
from ..schemas.user import TokenData
from ..models.user import User
from ..core.db import SessionLocal

# Replace with a strong secret key from environment variables in a real app
SECRET_KEY = "your-super-secret-and-very-long-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")  # Points to the login endpoint


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Creates a JWT access token.
    """

    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


def get_user_by_email(db: Session, email: str) -> User | None:
    """
    Retrieves a user by email from the database.
    """

    return db.query(User).filter(User.email == email).first()


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """
    Authenticates a user by checking email and password.
    """

    user = get_user_by_email(db, email)

    if not user:
        return None
    if not verify_password(password, user.password):
        return None
    return user


def get_email_from_token(token: str) -> str | None:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload.get("sub")


def get_user_from_token(token: str) -> User | None:
    email: str | None = get_email_from_token(token)
    db: Session = SessionLocal()
    if email is None:
        return

    user: User | None = get_user_by_email(db, email)
    db.close()
    return user


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Dependency to get the current authenticated user from the JWT token.
    """

    auth_err = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str | None = payload.get("sub")

        if email is None:
            raise auth_err
        token_data = TokenData(email=email)  # Using a new schema for token data

    except JWTError as e:
        raise auth_err from e

    user = get_user_by_email(db, email=token_data.email)
    if user is None:
        raise auth_err
    return user
