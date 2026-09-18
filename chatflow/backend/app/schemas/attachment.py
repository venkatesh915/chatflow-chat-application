from datetime import datetime
from pydantic import BaseModel

from typing import Optional

class AttachmentBase(BaseModel):
    file_name: str
    file_url: str
    file_type: str
    file_size: int
    duration: Optional[int] = None

class AttachmentCreate(AttachmentBase):
    pass

class AttachmentOut(AttachmentBase):
    id: int
    message_id: int
    created_at: datetime

    class Config:
        from_attributes = True
