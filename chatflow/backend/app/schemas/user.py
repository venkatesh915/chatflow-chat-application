from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    phone: Optional[str] = None
    about: Optional[str] = "Hey there! I am using ChatFlow."
    profile_image: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    phone: Optional[str] = None
    about: Optional[str] = None
    profile_image: Optional[str] = None

class UserOut(UserBase):
    id: int
    is_online: bool
    last_seen: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserBrief(BaseModel):
    id: int
    name: str
    username: str
    profile_image: Optional[str] = None
    is_online: bool
    last_seen: Optional[datetime] = None

    class Config:
        from_attributes = True

class BlockedUserOut(BaseModel):
    id: int
    blocked_id: int
    blocked_user: UserBrief
    created_at: datetime

    class Config:
        from_attributes = True

class UserPrivacySettingsOut(BaseModel):
    profile_photo: str = "everyone"
    about: str = "everyone"
    last_seen: str = "everyone"
    online_status: str = "everyone"
    read_receipts: bool = True
    group_add: str = "everyone"

    class Config:
        from_attributes = True

class UserPrivacySettingsUpdate(BaseModel):
    profile_photo: Optional[str] = Field(None, pattern="^(everyone|contacts|nobody)$")
    about: Optional[str] = Field(None, pattern="^(everyone|contacts|nobody)$")
    last_seen: Optional[str] = Field(None, pattern="^(everyone|contacts|nobody)$")
    online_status: Optional[str] = Field(None, pattern="^(everyone|same_as_last_seen)$")
    read_receipts: Optional[bool] = None
    group_add: Optional[str] = Field(None, pattern="^(everyone|contacts|nobody)$")

class UserProfilePublic(BaseModel):
    id: int
    name: str
    username: str
    profile_image: Optional[str] = None
    about: Optional[str] = None
    is_online: bool = False
    last_seen: Optional[datetime] = None
