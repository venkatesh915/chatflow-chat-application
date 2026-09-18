from typing import Optional, List
from pydantic import BaseModel, Field

class GroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    group_image: Optional[str] = None
    member_ids: List[int] = Field(default_factory=list)

class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    group_image: Optional[str] = None

class GroupMemberAdd(BaseModel):
    user_id: int

class GroupMemberRole(BaseModel):
    is_admin: bool
