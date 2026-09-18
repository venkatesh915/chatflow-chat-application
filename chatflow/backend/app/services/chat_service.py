from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from app.models.chat import Chat, ChatMember
from app.models.message import Message
from app.models.user import User, BlockedUser
from app.schemas.chat import ChatOut, ChatMemberOut
from app.schemas.user import UserBrief
from app.schemas.group import GroupCreate
from app.services.message_service import format_message
from app.services.privacy_service import filter_user_for_requester

def get_or_create_direct_chat(db: Session, user1_id: int, user2_id: int) -> Chat:
    if user1_id == user2_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create a chat with yourself."
        )

    # Check if target user exists
    target_user = db.query(User).filter(User.id == user2_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user does not exist."
        )

    # Find existing direct chat between these two users
    subq = (
        db.query(ChatMember.chat_id)
        .join(Chat, Chat.id == ChatMember.chat_id)
        .filter(Chat.type == "direct", ChatMember.user_id.in_([user1_id, user2_id]))
        .group_by(ChatMember.chat_id)
        .having(func.count(ChatMember.user_id) == 2)
        .first()
    )

    if subq:
        chat = db.query(Chat).filter(Chat.id == subq[0]).first()
        return chat

    # Create new direct chat
    new_chat = Chat(type="direct", created_by_id=user1_id)
    db.add(new_chat)
    db.flush()

    member1 = ChatMember(chat_id=new_chat.id, user_id=user1_id, is_admin=True)
    member2 = ChatMember(chat_id=new_chat.id, user_id=user2_id, is_admin=False)
    db.add_all([member1, member2])
    db.commit()
    db.refresh(new_chat)
    return new_chat

def create_group_chat(db: Session, creator_id: int, data: GroupCreate) -> Chat:
    new_group = Chat(
        type="group",
        name=data.name.strip(),
        description=data.description.strip() if data.description else None,
        group_image=data.group_image,
        created_by_id=creator_id
    )
    db.add(new_group)
    db.flush()

    # Add creator as admin
    creator_member = ChatMember(
        chat_id=new_group.id,
        user_id=creator_id,
        is_admin=True
    )
    db.add(creator_member)

    # Add selected members
    all_member_ids = set(data.member_ids)
    all_member_ids.discard(creator_id)
    for uid in all_member_ids:
        user = db.query(User).filter(User.id == uid).first()
        if user:
            member = ChatMember(
                chat_id=new_group.id,
                user_id=uid,
                is_admin=False
            )
            db.add(member)

    # System message
    creator_user = db.query(User).filter(User.id == creator_id).first()
    creator_name = creator_user.name if creator_user else "Someone"
    system_msg = Message(
        chat_id=new_group.id,
        sender_id=None,
        content=f"{creator_name} created group \"{data.name.strip()}\"",
        message_type="system"
    )
    db.add(system_msg)

    db.commit()
    db.refresh(new_group)
    return new_group

def format_chat_out(chat: Chat, current_user_id: int, db: Session) -> ChatOut:
    # Current user's membership details
    current_member = next((m for m in chat.members if m.user_id == current_user_id), None)
    is_pinned = current_member.is_pinned if current_member else False
    is_muted = current_member.is_muted if current_member else False
    is_archived = current_member.is_archived if current_member else False
    last_read_id = current_member.last_read_message_id if current_member else 0

    # Unread count
    unread_count = 0
    if last_read_id:
        unread_count = db.query(Message).filter(
            Message.chat_id == chat.id,
            Message.id > last_read_id,
            Message.sender_id != current_user_id,
            Message.is_deleted == False
        ).count()
    else:
        unread_count = db.query(Message).filter(
            Message.chat_id == chat.id,
            Message.sender_id != current_user_id,
            Message.is_deleted == False
        ).count()

    # Members list
    current_user = db.query(User).filter(User.id == current_user_id).first()
    members_out = []
    other_user_out = None
    for m in chat.members:
        if m.user:
            f_user = filter_user_for_requester(m.user, current_user, db)
            members_out.append(ChatMemberOut(
                user_id=f_user["id"],
                name=f_user["name"],
                username=f_user["username"],
                profile_image=f_user["profile_image"],
                is_admin=m.is_admin,
                is_muted=m.is_muted,
                is_archived=m.is_archived,
                is_pinned=m.is_pinned,
                is_online=f_user["is_online"],
                last_seen=f_user["last_seen"]
            ))
            if chat.type == "direct" and m.user.id != current_user_id:
                other_user_out = UserBrief(
                    id=f_user["id"],
                    name=f_user["name"],
                    username=f_user["username"],
                    profile_image=f_user["profile_image"],
                    is_online=f_user["is_online"],
                    last_seen=f_user["last_seen"]
                )

    # Last message
    last_msg = (
        db.query(Message)
        .filter(Message.chat_id == chat.id)
        .order_by(Message.created_at.desc())
        .first()
    )
    last_msg_out = format_message(last_msg, db, current_user_id) if last_msg else None

    # Name and image for direct chat
    chat_name = chat.name
    chat_image = chat.group_image
    if chat.type == "direct" and other_user_out:
        chat_name = other_user_out.name
        chat_image = other_user_out.profile_image

    return ChatOut(
        id=chat.id,
        type=chat.type,
        name=chat_name,
        description=chat.description,
        group_image=chat_image,
        created_at=chat.created_at,
        updated_at=chat.updated_at,
        last_message=last_msg_out,
        unread_count=unread_count,
        is_pinned=is_pinned,
        is_muted=is_muted,
        is_archived=is_archived,
        other_user=other_user_out,
        members=members_out
    )
