from fastapi import FastAPI
from .api import users, messages
from .api.ws import router as ws_router
from .core.db import Base, engine
from fastapi.middleware.cors import CORSMiddleware
import os


Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.environ.get("FRONTEND_HOST", "http://localhost:3000")
    ],  # ideally use ["http://localhost:5173"] or your deployed frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # or ["POST", "GET", "OPTIONS"]
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(messages.router)
app.include_router(ws_router)


@app.get("/")
def root():
    return {"message": "Chat App Ready 🚀"}
