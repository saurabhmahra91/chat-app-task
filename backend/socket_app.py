from fastapi import FastAPI
from fastapi_socketio import SocketManager

sio_app = FastAPI()
sio = SocketManager(app=sio_app)


@sio.on("message")
async def handle_message(sid, data):
    await sio.emit("message", data, skip_sid=sid)
