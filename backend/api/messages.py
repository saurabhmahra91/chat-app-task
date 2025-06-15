from fastapi import APIRouter, Depends
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.sql import and_, or_
from sqlalchemy import func, union_all
from ..core.db import SessionLocal
from ..models.message import Message
from ..schemas.user import FriendOut
from ..schemas.message import MessageCreate, MessageOut
from ..models.user import User
from ..api.auth import get_current_user


router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/messages", response_model=MessageOut)
def send_message(msg: MessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    receiver_id, msg_text = msg.receiver_id, msg.message
    sender_id = current_user.id
    db_msg = Message(sender_id=sender_id, receiver_id=receiver_id, message=msg_text)
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    return db_msg


@router.get("/messages", response_model=list[MessageOut])
def get_messages(friend_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    msgs = (
        db.query(Message)
        .filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == friend_id),
                and_(Message.sender_id == friend_id, Message.receiver_id == current_user.id),
            )
        )
        .order_by(Message.created_at.desc())
        .all()
    )
    return msgs


@router.get("/friends", response_model=list[tuple[FriendOut, datetime]])
def get_friends(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sent = (
        db.query(Message.receiver_id.label("other_user_id"), func.max(Message.created_at).label("latest_message_time"))
        .filter(Message.sender_id == current_user.id)
        .group_by(Message.receiver_id)
    )

    received = (
        db.query(Message.sender_id.label("other_user_id"), func.max(Message.created_at).label("latest_message_time"))
        .filter(Message.receiver_id == current_user.id)
        .group_by(Message.sender_id)
    )

    all_convos = union_all(sent, received).subquery()

    latest_per_user = (
        db.query(all_convos.c.other_user_id, func.max(all_convos.c.latest_message_time).label("latest_message_time"))
        .group_by(all_convos.c.other_user_id)
        .subquery()
    )

    result = (
        db.query(User, latest_per_user.c.latest_message_time)
        .join(latest_per_user, User.id == latest_per_user.c.other_user_id)
        .order_by(latest_per_user.c.latest_message_time.desc())
        .all()
    )

    return result
