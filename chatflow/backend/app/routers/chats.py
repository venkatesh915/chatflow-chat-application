from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.chat import Chat, ChatMember
from app.models.message import Message, MessageStatus
from app.models.user import User
from app.schemas.chat import (
    ChatOut, ChatCreateDirect, ChatPinUpdate, ChatMuteUpdate, ChatArchiveUpdate
)
from app.auth.dependencies import get_current_user
from app.services.chat_service import get_or_create_direct_chat, format_chat_out
from app.services.privacy_service import get_or_create_privacy_settings
from app.websocket.manager import manager

router = APIRouter(prefix="/api/chats", tags=["Chats"])

@router.get("", response_model=List[ChatOut])
def get_chats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Find all chats where current user is a member
    memberships = (
        db.query(ChatMember)
        .filter(ChatMember.user_id == current_user.id)
        .all()
    )
    chat_ids = [m.chat_id for m in memberships]

    chats = (
        db.query(Chat)
        .filter(Chat.id.in_(chat_ids))
        .order_by(desc(Chat.updated_at))
        .all()
    )

    formatted_chats = [format_chat_out(c, current_user.id, db) for c in chats]
    # Sort: pinned chats at top, then updated_at desc
    formatted_chats.sort(key=lambda x: (not x.is_pinned, -x.updated_at.timestamp()))
    return formatted_chats

@router.post("", response_model=ChatOut, status_code=status.HTTP_201_CREATED)
def create_direct_chat(
    data: ChatCreateDirect,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chat = get_or_create_direct_chat(db, current_user.id, data.target_user_id)
    chat_out = format_chat_out(chat, current_user.id, db)
    return chat_out

@router.get("/{chat_id}", response_model=ChatOut)
def get_chat_by_id(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    membership = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id,
        ChatMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this chat.")

    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found.")

    return format_chat_out(chat, current_user.id, db)

@router.delete("/{chat_id}")
def delete_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found.")

    membership = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id,
        ChatMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this chat.")

    if chat.type == "direct":
        # Delete membership or chat
        db.delete(chat)
    else:
        # Group chat: remove user from group
        db.delete(membership)

    db.commit()
    return {"message": "Chat deleted/left successfully."}

@router.put("/{chat_id}/pin")
def toggle_pin(
    chat_id: int,
    data: ChatPinUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    membership = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id,
        ChatMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat membership not found.")

    membership.is_pinned = data.is_pinned
    db.commit()
    return {"message": "Pin status updated.", "is_pinned": data.is_pinned}

@router.put("/{chat_id}/mute")
def toggle_mute(
    chat_id: int,
    data: ChatMuteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    membership = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id,
        ChatMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat membership not found.")

    membership.is_muted = data.is_muted
    db.commit()
    return {"message": "Mute status updated.", "is_muted": data.is_muted}

@router.put("/{chat_id}/archive")
def toggle_archive(
    chat_id: int,
    data: ChatArchiveUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    membership = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id,
        ChatMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat membership not found.")

    membership.is_archived = data.is_archived
    db.commit()
    return {"message": "Archive status updated.", "is_archived": data.is_archived}

@router.post("/{chat_id}/read")
async def mark_chat_read(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    membership = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id,
        ChatMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat membership not found.")

    latest_msg = (
        db.query(Message)
        .filter(Message.chat_id == chat_id)
        .order_by(desc(Message.id))
        .first()
    )
    if latest_msg:
        membership.last_read_message_id = latest_msg.id

        privacy = get_or_create_privacy_settings(current_user.id, db)
        if privacy.read_receipts:
            # Update direct messages status
            unread_direct_msgs = (
                db.query(Message)
                .filter(
                    Message.chat_id == chat_id,
                    Message.sender_id != current_user.id,
                    Message.id <= latest_msg.id,
                    Message.status != "read"
                )
                .all()
            )
            now = datetime.utcnow()
            for m in unread_direct_msgs:
                m.status = "read"
                m.read_at = now

            # Update message statuses for messages in this chat sent by others to 'read'
            statuses = (
                db.query(MessageStatus)
                .join(Message, Message.id == MessageStatus.message_id)
                .filter(Message.chat_id == chat_id, MessageStatus.user_id == current_user.id)
                .all()
            )
            for s in statuses:
                s.status = "read"

            db.commit()

            # Broadcast message:read event via WebSocket to chat members
            await manager.broadcast_to_chat(
                chat_id=chat_id,
                data={
                    "type": "message:read",
                    "chat_id": chat_id,
                    "reader_id": current_user.id,
                    "last_read_message_id": latest_msg.id
                },
                db=db,
                exclude_user_id=current_user.id
            )
        else:
            # Still commit last_read_message_id update for membership
            db.commit()

    return {"message": "Chat marked as read."}
