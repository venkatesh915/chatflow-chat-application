from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.attachment import AttachmentOut

class ReactionOut(BaseModel):
    id: int
    message_id: int
    user_id: int
    user_name: Optional[str] = None
    reaction: str
    created_at: datetime

    class Config:
        from_attributes = True

class ReactionToggle(BaseModel):
    reaction: str = Field(..., min_length=1, max_length=20)

class ReplyPreview(BaseModel):
    id: int
    sender_name: Optional[str] = None
    content: Optional[str] = None
    message_type: str = "text"

class MessageCreate(BaseModel):
    chat_id: int
    content: Optional[str] = None
    message_type: str = "text"  # "text", "image", "file", "voice", "system"
    reply_to_id: Optional[int] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = 0
    duration: Optional[int] = None

class MessageEdit(BaseModel):
    content: str = Field(..., min_length=1)

class MessageOut(BaseModel):
    id: int
    chat_id: int
    sender_id: Optional[int] = None
    sender_name: Optional[str] = None
    sender_image: Optional[str] = None
    content: Optional[str] = None
    message_type: str = "text"
    reply_to_id: Optional[int] = None
    reply_preview: Optional[ReplyPreview] = None
    is_edited: bool = False
    is_deleted: bool = False
    created_at: datetime
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    attachments: List[AttachmentOut] = []
    reactions: List[ReactionOut] = []
    status: str = "sent"  # "sent", "delivered", "read"

    class Config:
        from_attributes = True
