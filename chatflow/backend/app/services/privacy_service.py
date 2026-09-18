from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User, BlockedUser, UserPrivacySettings
from app.models.chat import Chat, ChatMember

def get_or_create_privacy_settings(user_id: int, db: Session) -> UserPrivacySettings:
    settings = db.query(UserPrivacySettings).filter(UserPrivacySettings.user_id == user_id).first()
    if not settings:
        settings = UserPrivacySettings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

def are_contacts(user_a_id: int, user_b_id: int, db: Session) -> bool:
    """Returns True if user A and user B share a direct conversation."""
    if user_a_id == user_b_id:
        return True

    # Check if there is a direct chat containing both users
    subq = (
        db.query(ChatMember.chat_id)
        .join(Chat, Chat.id == ChatMember.chat_id)
        .filter(Chat.type == "direct", ChatMember.user_id.in_([user_a_id, user_b_id]))
        .group_by(ChatMember.chat_id)
        .having(func.count(ChatMember.user_id) == 2)
        .first()
    )
    return subq is not None

def filter_user_for_requester(target_user: User, requester: Optional[User], db: Session) -> Dict[str, Any]:
    """Filters target_user's attributes strictly according to their privacy settings and block status."""
    if not requester:
        return {
            "id": target_user.id,
            "name": target_user.name,
            "username": target_user.username,
            "profile_image": None,
            "about": None,
            "is_online": False,
            "last_seen": None,
        }

    # Same user always sees own full info
    if target_user.id == requester.id:
        return {
            "id": target_user.id,
            "name": target_user.name,
            "username": target_user.username,
            "profile_image": target_user.profile_image,
            "about": target_user.about,
            "phone": target_user.phone,
            "is_online": target_user.is_online,
            "last_seen": target_user.last_seen,
        }

    # Check if target blocked requester
    is_blocked = db.query(BlockedUser).filter(
        BlockedUser.blocker_id == target_user.id,
        BlockedUser.blocked_id == requester.id
    ).first() is not None

    if is_blocked:
        return {
            "id": target_user.id,
            "name": target_user.name,
            "username": target_user.username,
            "profile_image": None,
            "about": None,
            "phone": None,
            "is_online": False,
            "last_seen": None,
        }

    privacy = get_or_create_privacy_settings(target_user.id, db)
    in_contacts = are_contacts(target_user.id, requester.id, db)

    # 1. Profile Photo
    profile_image = None
    if privacy.profile_photo == "everyone":
        profile_image = target_user.profile_image
    elif privacy.profile_photo == "contacts" and in_contacts:
        profile_image = target_user.profile_image

    # 2. About
    about = None
    if privacy.about == "everyone":
        about = target_user.about
    elif privacy.about == "contacts" and in_contacts:
        about = target_user.about

    # 3. Last Seen
    last_seen = None
    can_see_last_seen = False
    if privacy.last_seen == "everyone":
        last_seen = target_user.last_seen
        can_see_last_seen = True
    elif privacy.last_seen == "contacts" and in_contacts:
        last_seen = target_user.last_seen
        can_see_last_seen = True

    # 4. Online Status
    is_online = False
    if privacy.online_status == "everyone":
        is_online = target_user.is_online
    elif privacy.online_status == "same_as_last_seen":
        is_online = target_user.is_online if can_see_last_seen else False

    return {
        "id": target_user.id,
        "name": target_user.name,
        "username": target_user.username,
        "profile_image": profile_image,
        "about": about,
        "phone": None,  # Phone number is strictly private
        "is_online": is_online,
        "last_seen": last_seen,
    }
