from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..core.db import SessionLocal
from ..models.user import User
from ..models.message import Message
from ..schemas.user import UserCreate, UserOut, Token
from .auth import authenticate_user, create_access_token, get_current_user, get_password_hash
from fastapi.exceptions import HTTPException
from fastapi import status

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/users", response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    name, email, password = user.name, user.email, user.password
    password = get_password_hash(password)
    db_user = User(name=name, email=email, password=password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    existing_users = db.query(User).filter(User.id != db_user.id).all()
    for u in existing_users:
        intro_msg = Message(sender_id=db_user.id, receiver_id=u.id, message="Hi there, I am using this chat app 👋")
        db.add(intro_msg)
    db.commit()
    return db_user


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Handles user login, authenticates credentials, and returns a JWT access token.
    Uses OAuth2PasswordRequestForm for standard username/password flow.
    """

    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/users/me/", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Retrieves the current authenticated user's information.
    This is a protected endpoint, requiring a valid JWT.
    """
    return current_user
