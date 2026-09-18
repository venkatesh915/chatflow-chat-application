from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, PasswordChange
from app.auth.password import hash_password, verify_password

def register_user(db: Session, data: UserRegister) -> User:
    # Check email uniqueness
    existing_email = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered."
        )

    # Check username uniqueness
    existing_username = db.query(User).filter(User.username == data.username.lower().strip()).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already taken."
        )

    hashed_pw = hash_password(data.password)
    new_user = User(
        name=data.name.strip(),
        username=data.username.lower().strip(),
        email=data.email.lower().strip(),
        phone=data.phone.strip() if data.phone else None,
        password_hash=hashed_pw,
        profile_image=data.profile_image,
        about="Hey there! I am using ChatFlow."
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def authenticate_user(db: Session, data: UserLogin) -> User:
    query_identity = data.email.lower().strip()
    user = db.query(User).filter(
        (User.email == query_identity) | (User.username == query_identity)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/username or password."
        )

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/username or password."
        )

    return user

def change_password(db: Session, user: User, data: PasswordChange):
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    user.password_hash = hash_password(data.new_password)
    db.commit()
    return True
