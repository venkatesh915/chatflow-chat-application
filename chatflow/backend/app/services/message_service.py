from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.message import Message, MessageStatus
from app.models.attachment import Attachment
from app.models.reaction import Reaction
from app.models.chat import Chat, ChatMember
from app.models.user import User, BlockedUser
from app.schemas.message import MessageOut, ReactionOut, ReplyPreview
from app.schemas.attachment import AttachmentOut

def format_message(message: Message, db: Session, current_user_id: Optional[int] = None) -> MessageOut:
    sender_name = message.sender.name if message.sender else "System"
    sender_image = message.sender.profile_image if message.sender else None

    # Reply preview
    reply_preview = None
    if message.reply_to_id and message.reply_to:
        reply_preview = ReplyPreview(
            id=message.reply_to.id,
            sender_name=message.reply_to.sender.name if message.reply_to.sender else "System",
            content=message.reply_to.content if not message.reply_to.is_deleted else "This message was deleted",
            message_type=message.reply_to.message_type
        )

    # Attachments
    attachments_out = [
        AttachmentOut(
            id=att.id,
            message_id=att.message_id,
            file_name=att.file_name,
            file_url=att.file_url,
            file_type=att.file_type,
            file_size=att.file_size,
            duration=att.duration,
            created_at=att.created_at
        ) for att in message.attachments
    ]

    # Reactions
    reactions_out = [
        ReactionOut(
            id=r.id,
            message_id=r.message_id,
            user_id=r.user_id,
            user_name=r.user.name if r.user else "User",
            reaction=r.reaction,
            created_at=r.created_at
        ) for r in message.reactions
    ]

    # Status: Sent / Delivered / Read
    overall_status = message.status or "sent"
    if message.statuses:
        statuses = [s.status for s in message.statuses]
        if "read" in statuses:
            overall_status = "read"
        elif "delivered" in statuses:
            overall_status = "delivered"

    return MessageOut(
        id=message.id,
        chat_id=message.chat_id,
        sender_id=message.sender_id,
        sender_name=sender_name,
        sender_image=sender_image,
        content=message.content if not message.is_deleted else "This message was deleted",
        message_type=message.message_type,
        reply_to_id=message.reply_to_id,
        reply_preview=reply_preview,
        is_edited=message.is_edited,
        is_deleted=message.is_deleted,
        created_at=message.created_at,
        delivered_at=message.delivered_at,
        read_at=message.read_at,
        updated_at=message.updated_at,
        attachments=attachments_out,
        reactions=reactions_out,
        status=overall_status
    )

def create_message(
    db: Session,
    chat_id: int,
    sender_id: Optional[int],
    content: Optional[str] = None,
    message_type: str = "text",
    reply_to_id: Optional[int] = None,
    file_url: Optional[str] = None,
    file_name: Optional[str] = None,
    file_type: Optional[str] = None,
    file_size: Optional[int] = 0,
    duration: Optional[int] = None
) -> Message:
    # Verify sender is member of chat (if not system)
    if sender_id:
        membership = db.query(ChatMember).filter(
            ChatMember.chat_id == chat_id,
            ChatMember.user_id == sender_id
        ).first()
        if not membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this chat.")

        # Check block status if direct chat
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if chat and chat.type == "direct":
            other_member = db.query(ChatMember).filter(
                ChatMember.chat_id == chat_id,
                ChatMember.user_id != sender_id
            ).first()
            if other_member:
                # Check if other_member has blocked sender
                blocked = db.query(BlockedUser).filter(
                    BlockedUser.blocker_id == other_member.user_id,
                    BlockedUser.blocked_id == sender_id
                ).first()
                if blocked:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You cannot send messages because you have been blocked by this user."
                    )

    # Check recipient connection status via WebSocket manager
    from app.websocket.manager import manager

    members = db.query(ChatMember).filter(ChatMember.chat_id == chat_id).all()
    other_members = [m for m in members if m.user_id != sender_id]
    
    # If other members are currently connected to WS, mark delivered immediately
    is_delivered = len(other_members) > 0 and all(manager.is_user_online(m.user_id) for m in other_members)
    initial_status = "delivered" if is_delivered else "sent"
    delivered_at = datetime.utcnow() if is_delivered else None

    message = Message(
        chat_id=chat_id,
        sender_id=sender_id,
        content=content,
        message_type=message_type,
        reply_to_id=reply_to_id,
        status=initial_status,
        delivered_at=delivered_at
    )
    db.add(message)
    db.flush()

    if file_url and file_name:
        attachment = Attachment(
            message_id=message.id,
            file_name=file_name,
            file_url=file_url,
            file_type=file_type or "application/octet-stream",
            file_size=file_size or 0,
            duration=duration
        )
        db.add(attachment)

    # Add initial status for other members in chat
    for m in other_members:
        member_is_online = manager.is_user_online(m.user_id)
        m_status = MessageStatus(
            message_id=message.id,
            user_id=m.user_id,
            status="delivered" if member_is_online else "sent"
        )
        db.add(m_status)

    # Update chat updated_at
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if chat:
        chat.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(message)
    return message
