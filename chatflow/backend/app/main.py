import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.config import settings
from app.database import engine, Base, SessionLocal, get_db, run_migrations
import app.models  # Import all models for Base metadata
from app.routers import auth, users, chats, messages, groups, uploads
from app.auth.dependencies import get_current_user_from_token
from app.websocket.manager import manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create all database tables
    try:
        Base.metadata.create_all(bind=engine)
        run_migrations(engine)
        print("[ChatFlow] All database tables checked/created successfully.")
    except Exception as e:
        print(f"[ChatFlow] Database table initialization warning: {e}")
    yield
    # Shutdown logic if any

app = FastAPI(
    title="ChatFlow API",
    description="Full-stack WhatsApp Web clone backend with FastAPI, PostgreSQL, and WebSockets",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration - supports comma-separated FRONTEND_URL and local dev
cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if settings.FRONTEND_URL:
    for origin_url in settings.FRONTEND_URL.split(","):
        cleaned = origin_url.strip().rstrip("/")
        if cleaned and cleaned not in cors_origins:
            cors_origins.append(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register REST Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(chats.router)
app.include_router(messages.router)
app.include_router(groups.router)
app.include_router(uploads.router)

@app.get("/")
def root():
    return {
        "app": "ChatFlow API",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_url": "/health"
    }

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "unavailable"

    return {
        "status": "ok",
        "database": db_status
    }

# WebSocket Real-Time Chat Gateway
@app.websocket("/ws/chat")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    db = SessionLocal()
    user = None
    try:
        user = get_current_user_from_token(token, db)
        if not user:
            await websocket.close(code=4001, reason="Authentication failed")
            return

        await manager.connect(user.id, websocket, db)

        while True:
            data_text = await websocket.receive_text()
            try:
                event = json.loads(data_text)
                event_type = event.get("type")

                # Heartbeat Ping/Pong
                if event_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))

                # Real-time Typing Indicators
                elif event_type in ("typing:start", "typing:stop"):
                    chat_id = event.get("chat_id")
                    if chat_id:
                        await manager.broadcast_to_chat(
                            chat_id=chat_id,
                            data={
                                "type": "typing:update",
                                "chat_id": chat_id,
                                "user_id": user.id,
                                "user_name": user.name,
                                "is_typing": (event_type == "typing:start")
                            },
                            db=db,
                            exclude_user_id=user.id
                        )

            except json.JSONDecodeError:
                pass

    except WebSocketDisconnect:
        if user:
            await manager.disconnect(user.id, websocket, db)
    except Exception as e:
        if user:
            await manager.disconnect(user.id, websocket, db)
    finally:
        db.close()
