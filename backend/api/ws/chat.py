import json
from fastapi import WebSocket, WebSocketDisconnect, APIRouter, status
from ..auth import get_user_from_token
from ...models.message import Message
from ...models.user import User
from ...core.db import SessionLocal

router = APIRouter()

connected_clients: list[WebSocket] = []


@router.websocket("/ws/chat")
async def chat_websocket(websocket: WebSocket, token: str | None = None):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user: User | None = get_user_from_token(token)

    if user is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    connected_clients.append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            data = json.loads(data)

            assert "receiver_id" in data
            assert "message" in data

            db_msg = Message(sender_id=user.id, receiver_id=data["receiver_id"], message=data["message"])
            db = SessionLocal()
            db.add(db_msg)
            db.commit()
            db.close()

            msg_to_send = {"sender_id": user.id, "receiver_id": data["receiver_id"], "message": data["message"]}

            for client in connected_clients:
                if client != websocket:
                    await client.send_text(json.dumps(msg_to_send))
    except WebSocketDisconnect:
        connected_clients.remove(websocket)
