import json
from datetime import datetime
from typing import Dict, Set, List, Optional
from fastapi import WebSocket
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.chat import ChatMember

class ConnectionManager:
    def __init__(self):
        # Maps user_id -> set of active WebSockets (allows multiple tabs/devices)
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket, db: Session):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()

        is_first_connection = len(self.active_connections[user_id]) == 0
        self.active_connections[user_id].add(websocket)

        if is_first_connection:
            # Mark user online in database
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.is_online = True
                user.last_seen = datetime.utcnow()
                db.commit()

            # Mark any pending messages sent to this user as delivered
            try:
                from app.models.message import Message, MessageStatus
                from app.models.chat import ChatMember

                user_chat_ids = [c[0] for c in db.query(ChatMember.chat_id).filter(ChatMember.user_id == user_id).all()]
                if user_chat_ids:
                    pending_msgs = (
                        db.query(Message)
                        .filter(
                            Message.chat_id.in_(user_chat_ids),
                            Message.sender_id != user_id,
                            Message.status == "sent"
                        )
                        .all()
                    )
                    for p_msg in pending_msgs:
                        p_msg.status = "delivered"
                        p_msg.delivered_at = datetime.utcnow()
                        db.query(MessageStatus).filter(
                            MessageStatus.message_id == p_msg.id,
                            MessageStatus.user_id == user_id
                        ).update({"status": "delivered", "updated_at": datetime.utcnow()})
                    db.commit()

                    # Notify senders in real time
                    for p_msg in pending_msgs:
                        if p_msg.sender_id:
                            await self.send_personal_message(p_msg.sender_id, {
                                "type": "message:delivered",
                                "message_id": p_msg.id,
                                "chat_id": p_msg.chat_id,
                                "status": "delivered"
                            })
            except Exception as e:
                print(f"[WebSocket Manager] Delivery sync notice: {e}")

            # Broadcast presence to all other connected users
            await self.broadcast_all({
                "type": "user:presence",
                "user_id": user_id,
                "is_online": True,
                "last_seen": datetime.utcnow().isoformat()
            }, exclude_user_id=user_id)

    async def disconnect(self, user_id: int, websocket: WebSocket, db: Session):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if len(self.active_connections[user_id]) == 0:
                del self.active_connections[user_id]

                # Mark user offline in database
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    user.is_online = False
                    user.last_seen = datetime.utcnow()
                    db.commit()

                # Broadcast presence to all other connected users
                await self.broadcast_all({
                    "type": "user:presence",
                    "user_id": user_id,
                    "is_online": False,
                    "last_seen": datetime.utcnow().isoformat()
                }, exclude_user_id=user_id)

    def is_user_online(self, user_id: int) -> bool:
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

    async def send_personal_message(self, user_id: int, data: dict):
        if user_id in self.active_connections:
            dead_sockets = set()
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_text(json.dumps(data))
                except Exception:
                    dead_sockets.add(ws)
            for dead in dead_sockets:
                self.active_connections[user_id].discard(dead)

    async def broadcast_to_users(self, user_ids: List[int], data: dict, exclude_user_id: Optional[int] = None):
        for uid in user_ids:
            if exclude_user_id and uid == exclude_user_id:
                continue
            await self.send_personal_message(uid, data)

    async def broadcast_to_chat(self, chat_id: int, data: dict, db: Session, exclude_user_id: Optional[int] = None):
        members = db.query(ChatMember.user_id).filter(ChatMember.chat_id == chat_id).all()
        user_ids = [m[0] for m in members]
        await self.broadcast_to_users(user_ids, data, exclude_user_id=exclude_user_id)

    async def broadcast_all(self, data: dict, exclude_user_id: Optional[int] = None):
        for uid in list(self.active_connections.keys()):
            if exclude_user_id and uid == exclude_user_id:
                continue
            await self.send_personal_message(uid, data)

manager = ConnectionManager()
