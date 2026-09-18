from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.user import UserBrief
from app.schemas.message import MessageOut

class ChatMemberOut(BaseModel):
    user_id: int
    name: str
    username: str
    profile_image: Optional[str] = None
    is_admin: bool = False
    is_muted: bool = False
    is_archived: bool = False
    is_pinned: bool = False
    is_online: bool = False
    last_seen: Optional[datetime] = None

    class Config:
        from_attributes = True

class ChatCreateDirect(BaseModel):
    target_user_id: int

class ChatOut(BaseModel):
    id: int
    type: str  # "direct" or "group"
    name: Optional[str] = None
    description: Optional[str] = None
    group_image: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_message: Optional[MessageOut] = None
    unread_count: int = 0
    is_pinned: bool = False
    is_muted: bool = False
    is_archived: bool = False
    other_user: Optional[UserBrief] = None
    members: List[ChatMemberOut] = []

    class Config:
        from_attributes = True

class ChatPinUpdate(BaseModel):
    is_pinned: bool

class ChatMuteUpdate(BaseModel):
    is_muted: bool

class ChatArchiveUpdate(BaseModel):
    is_archived: bool
