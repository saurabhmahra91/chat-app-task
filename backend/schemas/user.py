from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        orm_mode = True


class FriendOut(BaseModel):
    id: int
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Schema for JWT token response
class Token(BaseModel):
    access_token: str
    token_type: str


# Schema to hold the data extracted from the JWT token
class TokenData(BaseModel):
    email: str | None = None

