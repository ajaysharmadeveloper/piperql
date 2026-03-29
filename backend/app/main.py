from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_setting
from app.routers import auth, users, conversations, databases, chat, settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="AI Database Agent API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(conversations.router, prefix="/api")
app.include_router(databases.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(settings.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
