"""
Seed script to create demo users, conversations, messages, and reactions.
Usage:
    python seed_data.py
"""
import sys
import os

# Add parent directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.chat import Chat, ChatMember
from app.models.message import Message, MessageStatus
from app.models.reaction import Reaction
from app.auth.password import hash_password

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("[Seed] Seeding database with demo accounts...")

        # Demo Users
        users_data = [
            {
                "name": "Alice Johnson",
                "username": "alice",
                "email": "alice@chatflow.com",
                "phone": "+1 (555) 019-2831",
                "about": "Product Designer & Coffee Lover ☕",
                "profile_image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
            },
            {
                "name": "Bob Smith",
                "username": "bob",
                "email": "bob@chatflow.com",
                "phone": "+1 (555) 014-9382",
                "about": "Frontend Engineer | Building cool stuff 🚀",
                "profile_image": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
            },
            {
                "name": "Charlie Brown",
                "username": "charlie",
                "email": "charlie@chatflow.com",
                "phone": "+1 (555) 018-4720",
                "about": "Exploring the universe 🌌",
                "profile_image": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150"
            },
            {
                "name": "Diana Prince",
                "username": "diana",
                "email": "diana@chatflow.com",
                "phone": "+1 (555) 017-8391",
                "about": "Full-Stack Dev & Open Source enthusiast 💻",
                "profile_image": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150"
            }
        ]

        created_users = {}
        default_pw = hash_password("Password123!")

        for u_data in users_data:
            existing = db.query(User).filter(User.username == u_data["username"]).first()
            if not existing:
                user = User(
                    name=u_data["name"],
                    username=u_data["username"],
                    email=u_data["email"],
                    phone=u_data["phone"],
                    about=u_data["about"],
                    profile_image=u_data["profile_image"],
                    password_hash=default_pw,
                    is_online=True if u_data["username"] in ("bob", "alice") else False,
                    last_seen=datetime.utcnow() - timedelta(minutes=15)
                )
                db.add(user)
                db.flush()
                created_users[u_data["username"]] = user
            else:
                created_users[u_data["username"]] = existing

        db.commit()

        alice = created_users["alice"]
        bob = created_users["bob"]
        charlie = created_users["charlie"]
        diana = created_users["diana"]

        # Check if direct chat between Alice and Bob exists
        existing_chat = (
            db.query(Chat)
            .join(ChatMember)
            .filter(Chat.type == "direct", ChatMember.user_id == alice.id)
            .first()
        )

        if not existing_chat:
            print("[Seed] Creating direct chat between Alice and Bob...")
            chat_ab = Chat(type="direct", created_by_id=alice.id)
            db.add(chat_ab)
            db.flush()

            db.add_all([
                ChatMember(chat_id=chat_ab.id, user_id=alice.id, is_admin=True, is_pinned=True),
                ChatMember(chat_id=chat_ab.id, user_id=bob.id, is_admin=False)
            ])

            # Sample Messages
            t0 = datetime.utcnow() - timedelta(minutes=45)
            m1 = Message(
                chat_id=chat_ab.id,
                sender_id=bob.id,
                content="Hey Alice! How is the new WhatsApp Web clone UI looking?",
                message_type="text",
                created_at=t0
            )
            db.add(m1)
            db.flush()

            t1 = t0 + timedelta(minutes=5)
            m2 = Message(
                chat_id=chat_ab.id,
                sender_id=alice.id,
                content="It looks incredible! The green accents, smooth dark mode, and real-time WebSockets feel so snappy 🔥",
                message_type="text",
                reply_to_id=m1.id,
                created_at=t1
            )
            db.add(m2)
            db.flush()

            # Add reaction to m2
            rx = Reaction(message_id=m2.id, user_id=bob.id, reaction="❤️")
            db.add(rx)

            t2 = t1 + timedelta(minutes=2)
            m3 = Message(
                chat_id=chat_ab.id,
                sender_id=bob.id,
                content="Awesome! Let's test image and file attachments next.",
                message_type="text",
                created_at=t2
            )
            db.add(m3)

            # Direct chat with Charlie
            chat_ac = Chat(type="direct", created_by_id=charlie.id)
            db.add(chat_ac)
            db.flush()
            db.add_all([
                ChatMember(chat_id=chat_ac.id, user_id=alice.id, is_admin=False),
                ChatMember(chat_id=chat_ac.id, user_id=charlie.id, is_admin=True)
            ])
            m_ac = Message(
                chat_id=chat_ac.id,
                sender_id=charlie.id,
                content="Hey Alice! Did you see the release notes for ChatFlow?",
                created_at=datetime.utcnow() - timedelta(hours=2)
            )
            db.add(m_ac)

            # Demo Group Chat
            print("[Seed] Creating group chat 'ChatFlow Engineering'...")
            group = Chat(
                type="group",
                name="ChatFlow Engineering 🛠️",
                description="Frontend, Backend, and Real-time Architecture discussions",
                group_image="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150",
                created_by_id=alice.id
            )
            db.add(group)
            db.flush()

            db.add_all([
                ChatMember(chat_id=group.id, user_id=alice.id, is_admin=True),
                ChatMember(chat_id=group.id, user_id=bob.id, is_admin=False),
                ChatMember(chat_id=group.id, user_id=charlie.id, is_admin=False),
                ChatMember(chat_id=group.id, user_id=diana.id, is_admin=False),
            ])

            sys_msg = Message(
                chat_id=group.id,
                sender_id=None,
                content="Alice Johnson created group \"ChatFlow Engineering 🛠️\"",
                message_type="system",
                created_at=datetime.utcnow() - timedelta(hours=3)
            )
            db.add(sys_msg)

            gm1 = Message(
                chat_id=group.id,
                sender_id=diana.id,
                content="Welcome everyone! Ready for real-time messaging tests?",
                created_at=datetime.utcnow() - timedelta(hours=2, minutes=30)
            )
            db.add(gm1)

            db.commit()
            print("[Seed] Demo data created successfully!")
        else:
            print("[Seed] Demo chats already exist.")

    finally:
        db.close()

if __name__ == "__main__":
    seed()



