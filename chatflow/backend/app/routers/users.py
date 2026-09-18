from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.user import User, BlockedUser
from app.schemas.user import (
    UserOut, UserBrief, UserUpdate, BlockedUserOut,
    UserPrivacySettingsOut, UserPrivacySettingsUpdate, UserProfilePublic
)
from app.schemas.auth import PasswordChange
from app.auth.dependencies import get_current_user
from app.services.auth_service import change_password
from app.services.privacy_service import get_or_create_privacy_settings, filter_user_for_requester

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/search", response_model=List[UserProfilePublic])
@router.get("", response_model=List[UserProfilePublic])
def search_users(
    q: Optional[str] = Query(None, description="Search term for username or phone"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Privacy rule: Do NOT show all users when query is empty!
    if not q or not q.strip():
        return []

    raw = q.strip()
    clean_username = (raw[1:] if raw.startswith("@") else raw).lower()
    digits = "".join(filter(str.isdigit, raw))

    candidates = (
        db.query(User)
        .filter(User.id != current_user.id)
        .all()
    )

    matching_users = []
    for u in candidates:
        # Match username (starts with or exact)
        u_username = (u.username or "").lower()
        if u_username.startswith(clean_username) or clean_username in u_username:
            matching_users.append(u)
            continue

        # Match phone digits
        if len(digits) >= 3 and u.phone:
            u_digits = "".join(filter(str.isdigit, u.phone))
            if digits in u_digits:
                matching_users.append(u)
                continue

    matching_users = matching_users[:20]

    results = []
    for u in matching_users:
        filtered = filter_user_for_requester(u, current_user, db)
        results.append(UserProfilePublic(**filtered))
    return results

@router.get("/privacy", response_model=UserPrivacySettingsOut)
def get_privacy(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    settings = get_or_create_privacy_settings(current_user.id, db)
    return UserPrivacySettingsOut.model_validate(settings)

@router.put("/privacy", response_model=UserPrivacySettingsOut)
def update_privacy(
    data: UserPrivacySettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    settings = get_or_create_privacy_settings(current_user.id, db)
    if data.profile_photo is not None:
        settings.profile_photo = data.profile_photo
    if data.about is not None:
        settings.about = data.about
    if data.last_seen is not None:
        settings.last_seen = data.last_seen
    if data.online_status is not None:
        settings.online_status = data.online_status
    if data.read_receipts is not None:
        settings.read_receipts = data.read_receipts
    if data.group_add is not None:
        settings.group_add = data.group_add
    db.commit()
    db.refresh(settings)
    return UserPrivacySettingsOut.model_validate(settings)

@router.get("/me", response_model=UserOut)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)

@router.put("/profile", response_model=UserOut)
def update_profile(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.name is not None:
        current_user.name = data.name.strip()
    if data.username is not None and data.username.lower().strip() != current_user.username:
        new_username = data.username.lower().strip()
        existing = db.query(User).filter(User.username == new_username, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username is already taken.")
        current_user.username = new_username
    if data.phone is not None:
        current_user.phone = data.phone.strip()
    if data.about is not None:
        current_user.about = data.about.strip()
    if data.profile_image is not None:
        current_user.profile_image = data.profile_image

    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)

@router.put("/password")
def update_password(
    data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    change_password(db, current_user, data)
    return {"message": "Password changed successfully."}

@router.get("/blocked/list", response_model=List[BlockedUserOut])
def get_blocked_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    blocks = db.query(BlockedUser).filter(BlockedUser.blocker_id == current_user.id).all()
    result = []
    for b in blocks:
        if b.blocked:
            result.append(BlockedUserOut(
                id=b.id,
                blocked_id=b.blocked_id,
                blocked_user=UserBrief.model_validate(b.blocked),
                created_at=b.created_at
            ))
    return result

@router.post("/{user_id}/block")
def block_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot block yourself.")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    existing = db.query(BlockedUser).filter(
        BlockedUser.blocker_id == current_user.id,
        BlockedUser.blocked_id == user_id
    ).first()

    if not existing:
        new_block = BlockedUser(blocker_id=current_user.id, blocked_id=user_id)
        db.add(new_block)
        db.commit()

    return {"message": f"User {target.name} blocked successfully."}

@router.delete("/{user_id}/block")
def unblock_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    block = db.query(BlockedUser).filter(
        BlockedUser.blocker_id == current_user.id,
        BlockedUser.blocked_id == user_id
    ).first()

    if block:
        db.delete(block)
        db.commit()

    return {"message": "User unblocked successfully."}

@router.get("/{user_id}/profile", response_model=UserProfilePublic)
def get_user_public_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    filtered = filter_user_for_requester(target, current_user, db)
    return UserProfilePublic(**filtered)

@router.get("/{user_id}", response_model=UserBrief)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    filtered = filter_user_for_requester(user, current_user, db)
    return UserBrief(
        id=filtered["id"],
        name=filtered["name"],
        username=filtered["username"],
        profile_image=filtered["profile_image"],
        is_online=filtered["is_online"],
        last_seen=filtered["last_seen"]
    )
