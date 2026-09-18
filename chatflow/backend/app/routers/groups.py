from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.chat import Chat, ChatMember
from app.models.message import Message
from app.models.user import User
from app.schemas.group import GroupCreate, GroupUpdate, GroupMemberAdd
from app.schemas.chat import ChatOut
from app.auth.dependencies import get_current_user
from app.services.chat_service import create_group_chat, format_chat_out
from app.websocket.manager import manager

router = APIRouter(prefix="/api/groups", tags=["Groups"])

@router.post("", response_model=ChatOut, status_code=status.HTTP_201_CREATED)
async def create_group(
    data: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    group = create_group_chat(db, current_user.id, data)
    group_out = format_chat_out(group, current_user.id, db)

    # Notify all members via WebSocket
    member_ids = [m.user_id for m in group.members]
    await manager.broadcast_to_users(
        user_ids=member_ids,
        data={
            "type": "chat:created",
            "chat": group_out.model_dump(mode="json")
        }
    )

    return group_out

@router.put("/{group_id}", response_model=ChatOut)
async def update_group(
    group_id: int,
    data: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    group = db.query(Chat).filter(Chat.id == group_id, Chat.type == "group").first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")

    membership = db.query(ChatMember).filter(
        ChatMember.chat_id == group_id,
        ChatMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this group.")

    if data.name is not None:
        old_name = group.name
        group.name = data.name.strip()
        system_msg = Message(
            chat_id=group.id,
            sender_id=None,
            content=f"{current_user.name} changed the group name to \"{group.name}\"",
            message_type="system"
        )
        db.add(system_msg)

    if data.description is not None:
        group.description = data.description.strip()
    if data.group_image is not None:
        group.group_image = data.group_image

    db.commit()
    db.refresh(group)

    group_out = format_chat_out(group, current_user.id, db)

    # Broadcast update
    await manager.broadcast_to_chat(
        chat_id=group.id,
        data={
            "type": "chat:updated",
            "chat": group_out.model_dump(mode="json")
        },
        db=db
    )

    return group_out

@router.post("/{group_id}/members")
async def add_member(
    group_id: int,
    data: GroupMemberAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    group = db.query(Chat).filter(Chat.id == group_id, Chat.type == "group").first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")

    # Check caller is member
    caller_mem = db.query(ChatMember).filter(
        ChatMember.chat_id == group_id,
        ChatMember.user_id == current_user.id
    ).first()
    if not caller_mem:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this group.")

    # Check target user
    target_user = db.query(User).filter(User.id == data.user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    # Check if already member
    existing = db.query(ChatMember).filter(
        ChatMember.chat_id == group_id,
        ChatMember.user_id == data.user_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already a member of this group.")

    new_mem = ChatMember(chat_id=group_id, user_id=data.user_id, is_admin=False)
    db.add(new_mem)

    # System message
    sys_msg = Message(
        chat_id=group_id,
        sender_id=None,
        content=f"{current_user.name} added {target_user.name}",
        message_type="system"
    )
    db.add(sys_msg)
    db.commit()

    # Broadcast update
    group_out = format_chat_out(group, current_user.id, db)
    await manager.broadcast_to_chat(
        chat_id=group_id,
        data={
            "type": "chat:updated",
            "chat": group_out.model_dump(mode="json")
        },
        db=db
    )

    return {"message": f"{target_user.name} added to group."}

@router.delete("/{group_id}/members/{user_id}")
async def remove_member(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    group = db.query(Chat).filter(Chat.id == group_id, Chat.type == "group").first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")

    caller_mem = db.query(ChatMember).filter(
        ChatMember.chat_id == group_id,
        ChatMember.user_id == current_user.id
    ).first()
    if not caller_mem or not caller_mem.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only group admins can remove members.")

    target_mem = db.query(ChatMember).filter(
        ChatMember.chat_id == group_id,
        ChatMember.user_id == user_id
    ).first()
    if not target_mem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in group.")

    target_user = db.query(User).filter(User.id == user_id).first()
    target_name = target_user.name if target_user else "User"

    db.delete(target_mem)

    # System message
    sys_msg = Message(
        chat_id=group_id,
        sender_id=None,
        content=f"{current_user.name} removed {target_name}",
        message_type="system"
    )
    db.add(sys_msg)
    db.commit()

    group_out = format_chat_out(group, current_user.id, db)
    await manager.broadcast_to_chat(
        chat_id=group_id,
        data={
            "type": "chat:updated",
            "chat": group_out.model_dump(mode="json")
        },
        db=db
    )

    return {"message": f"{target_name} removed from group."}

@router.post("/{group_id}/leave")
async def leave_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    group = db.query(Chat).filter(Chat.id == group_id, Chat.type == "group").first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")

    membership = db.query(ChatMember).filter(
        ChatMember.chat_id == group_id,
        ChatMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You are not a member of this group.")

    db.delete(membership)

    sys_msg = Message(
        chat_id=group_id,
        sender_id=None,
        content=f"{current_user.name} left the group",
        message_type="system"
    )
    db.add(sys_msg)
    db.commit()

    group_out = format_chat_out(group, current_user.id, db)
    await manager.broadcast_to_chat(
        chat_id=group_id,
        data={
            "type": "chat:updated",
            "chat": group_out.model_dump(mode="json")
        },
        db=db
    )

    return {"message": "You left the group."}
