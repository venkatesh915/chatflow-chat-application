from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(25), nullable=True)
    password_hash = Column(String(255), nullable=False)
    profile_image = Column(String(255), nullable=True)
    about = Column(String(255), default="Hey there! I am using ChatFlow.")
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    chat_memberships = relationship("ChatMember", back_populates="user", cascade="all, delete-orphan")
    sent_messages = relationship("Message", back_populates="sender", foreign_keys="Message.sender_id")
    reactions = relationship("Reaction", back_populates="user", cascade="all, delete-orphan")
    blocked_by_me = relationship("BlockedUser", foreign_keys="BlockedUser.blocker_id", back_populates="blocker")
    blocked_me = relationship("BlockedUser", foreign_keys="BlockedUser.blocked_id", back_populates="blocked")
    privacy_settings = relationship("UserPrivacySettings", back_populates="user", uselist=False, cascade="all, delete-orphan")


class UserPrivacySettings(Base):
    __tablename__ = "user_privacy_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    profile_photo = Column(String(20), default="everyone")  # "everyone", "contacts", "nobody"
    about = Column(String(20), default="everyone")          # "everyone", "contacts", "nobody"
    last_seen = Column(String(20), default="everyone")      # "everyone", "contacts", "nobody"
    online_status = Column(String(20), default="everyone")  # "everyone", "same_as_last_seen"
    read_receipts = Column(Boolean, default=True)           # True, False
    group_add = Column(String(20), default="everyone")      # "everyone", "contacts", "nobody"
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="privacy_settings")


class BlockedUser(Base):
    __tablename__ = "blocked_users"

    id = Column(Integer, primary_key=True, index=True)
    blocker_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    blocked_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    blocker = relationship("User", foreign_keys=[blocker_id], back_populates="blocked_by_me")
    blocked = relationship("User", foreign_keys=[blocked_id], back_populates="blocked_me")
