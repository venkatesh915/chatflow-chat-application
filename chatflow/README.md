# ChatFlow

A full-stack real-time messaging application inspired by WhatsApp Web, built with:

* **Frontend**: React, JavaScript, HTML5, CSS3, React Router, Axios, Lucide Icons
* **Backend**: FastAPI, Python, SQLAlchemy ORM, Pydantic, WebSockets, Uvicorn
* **Database**: PostgreSQL (with automatic local SQLite fallback for development)
* **Real-Time Communication**: Bidirectional WebSockets with JSON event protocol

---

## Features

* **User Registration & Login**: JWT authentication, bcrypt password hashing, session persistence.
* **Username & Phone Search**: Privacy-first search in "New Chat" by `@username` or phone digits without listing registered accounts.
* **Granular Privacy Settings**: Full WhatsApp-style controls for Profile Photo, About, Last Seen, Online Status, Read Receipts (ON/OFF), and Group Add permissions.
* **User Profile & Contact Info**: Inspect contact profiles, bio, and presence respecting privacy settings.
* **One-to-One & Group Chats**: Instant private conversations and multi-member group chats with admin controls.
* **Real-Time Messaging**: Instant delivery over WebSockets with heartbeat keep-alive.
* **Message Status Receipts**: Single tick (`✓` Sent) $\rightarrow$ Double grey ticks (`✓✓` Delivered) $\rightarrow$ Double blue ticks (`✓✓` Read). Suppressed when read receipts are disabled.
* **Voice Messages**: In-browser audio recording via `MediaRecorder` with pulsing indicator (`🔴 00:05`), cancel/send buttons, and a WhatsApp-style audio player with progress scrubber.
* **Image & File Sharing**: Upload and preview photos, documents (PDF, DOCX, TXT, ZIP) with lightbox zoom and download options.
* **Message Reactions**: Quick emoji reactions (❤️, 👍, 😂, 😮, 😢, 😡) with aggregated counter pills.
* **Rich Interactions**: In-line message replies with original message preview, in-line editing, and deletion.
* **Chat Management**: Pin, mute, archive, clear, and delete conversations; block/unblock contacts.
* **Typing Indicators**: Real-time *"User is typing..."* presence updates.
* **Dark & Light Mode**: WhatsApp dark slate theme and clean light theme with instant toggle.
* **Responsive UI**: Split-pane desktop view and seamless mobile view with conversation back button.

---

## Architecture

```text
React (Vite SPA)
  │
  ├── REST APIs (Axios) ──► FastAPI Backend (Port 8000 / Render)
  │                              │
  ├── WebSockets (Native) ◄──────┤
  │                              ▼
  │                     PostgreSQL Database
  ▼
Browser Audio & Media APIs (MediaRecorder / Web Audio)
```

---

## Local Development Setup

### 1. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env     # On Windows
# cp .env.example .env     # On macOS/Linux

# Start FastAPI backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
copy .env.example .env     # On Windows
# cp .env.example .env     # On macOS/Linux

# Start Vite dev server
npm run dev
```

---

## Production Deployment

### Backend (Render)
* **Root Directory**: `chatflow/backend` (or `backend`)
* **Build Command**: `pip install -r requirements.txt`
* **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
* **Environment Variables**:
  * `DATABASE_URL`: PostgreSQL connection URI
  * `SECRET_KEY`: 32+ character random secret
  * `FRONTEND_URL`: `https://YOUR-APP.vercel.app`

### Frontend (Vercel)
* **Root Directory**: `chatflow/frontend` (or `frontend`)
* **Framework**: Vite
* **Build Command**: `npm run build`
* **Output Directory**: `dist`
* **Environment Variables**:
  * `VITE_API_URL`: `https://YOUR-BACKEND.onrender.com`
  * `VITE_WS_URL`: `wss://YOUR-BACKEND.onrender.com`
