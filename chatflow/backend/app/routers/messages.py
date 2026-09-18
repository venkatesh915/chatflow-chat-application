from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from app.database import get_db
from app.models.message import Message, MessageStatus
from app.models.chat import Chat, ChatMember
from app.models.user import User
from app.models.reaction import Reaction
from app.schemas.message import MessageCreate, MessageEdit, MessageOut, ReactionToggle
from app.auth.dependencies import get_current_user
from app.services.message_service import create_message, format_message
from app.websocket.manager import manager

router = APIRouter(prefix="/api/messages", tags=["Messages"])

@router.get("/{chat_id}", response_model=List[MessageOut])
def get_chat_messages(
    chat_id: int,
    q: Optional[str] = Query(None, description="Search keyword in chat messages"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify user is member of chat
    membership = db.query(ChatMember).filter(
        ChatMember.chat_id == chat_id,
        ChatMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not belong to this chat.")

    query = db.query(Message).filter(Message.chat_id == chat_id)
    if q and q.strip():
        term = f"%{q.strip().lower()}%"
        query = query.filter(Message.content.ilike(term), Message.is_deleted == False)

    messages = (
        query.order_by(asc(Message.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [format_message(m, db, current_user.id) for m in messages]

@router.post("", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def send_message(
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    msg = create_message(
        db=db,
        chat_id=data.chat_id,
        sender_id=current_user.id,
        content=data.content,
        message_type=data.message_type,
        reply_to_id=data.reply_to_id,
        file_url=data.file_url,
        file_name=data.file_name,
        file_type=data.file_type,
        file_size=data.file_size,
        duration=data.duration
    )

    formatted = format_message(msg, db, current_user.id)

    # Broadcast to all members of this chat in real time via WebSocket
    await manager.broadcast_to_chat(
        chat_id=data.chat_id,
        data={
            "type": "message:new",
            "message": formatted.model_dump(mode="json")
        },
        db=db
    )

    return formatted

@router.put("/{message_id}", response_model=MessageOut)
async def edit_message(
    message_id: int,
    data: MessageEdit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found.")

    if message.sender_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own messages.")

    if message.is_deleted:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot edit a deleted message.")

    message.content = data.content.strip()
    message.is_edited = True
    db.commit()
    db.refresh(message)

    formatted = format_message(message, db, current_user.id)

    # Broadcast update to chat
    await manager.broadcast_to_chat(
        chat_id=message.chat_id,
        data={
            "type": "message:update",
            "message": formatted.model_dump(mode="json")
        },
        db=db
    )

    return formatted

@router.delete("/{message_id}")
async def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found.")

    if message.sender_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own messages.")

    message.is_deleted = True
    message.content = "This message was deleted"
    db.commit()

    # Broadcast delete event
    await manager.broadcast_to_chat(
        chat_id=message.chat_id,
        data={
            "type": "message:delete",
            "message_id": message.id,
            "chat_id": message.chat_id
        },
        db=db
    )

    return {"message": "Message deleted successfully."}

@router.post("/{message_id}/reaction", response_model=MessageOut)
async def toggle_reaction(
    message_id: int,
    data: ReactionToggle,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found.")

    # Check membership
    membership = db.query(ChatMember).filter(
        ChatMember.chat_id == message.chat_id,
        ChatMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this chat.")

    existing_rx = db.query(Reaction).filter(
        Reaction.message_id == message_id,
        Reaction.user_id == current_user.id,
        Reaction.reaction == data.reaction
    ).first()

    if existing_rx:
        # Toggle off
        db.delete(existing_rx)
    else:
        # Add reaction (remove any other reaction by this user on this message first for clean single reaction per user)
        db.query(Reaction).filter(
            Reaction.message_id == message_id,
            Reaction.user_id == current_user.id
        ).delete()
        new_rx = Reaction(message_id=message_id, user_id=current_user.id, reaction=data.reaction)
        db.add(new_rx)

    db.commit()
    db.refresh(message)

    formatted = format_message(message, db, current_user.id)

    # Broadcast reaction update
    await manager.broadcast_to_chat(
        chat_id=message.chat_id,
        data={
            "type": "message:update",
            "message": formatted.model_dump(mode="json")
        },
        db=db
    )

    return formatted
