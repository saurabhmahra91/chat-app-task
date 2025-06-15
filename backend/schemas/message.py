from pydantic import BaseModel


class MessageCreate(BaseModel):
    receiver_id: int
    message: str


class MessageOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    message: str

    class Config:
        orm_mode = True
