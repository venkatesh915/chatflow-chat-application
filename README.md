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

### Prerequisites
* Python 3.10+ (Python 3.12 recommended)
* Node.js 18+ and npm
* PostgreSQL (Optional: if not running, backend automatically falls back to local SQLite `chatflow.db`)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/chatflow.git
cd chatflow
```

### 2. Backend Setup
```bash
cd chatflow/backend

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
```



Start the FastAPI backend:
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* Interactive API Docs: `http://127.0.0.1:8000/docs`
* Health Check: `http://127.0.0.1:8000/health`

### 3. Frontend Setup
Open a new terminal:
```bash
cd chatflow/frontend

# Install dependencies
npm install


Start Vite development server:
```bash
npm run dev
```
Open `http://localhost:5173/` in your browser.

---

## Production Deployment Guide

### Deployment Architecture
* **Frontend**: Vercel (Vite React SPA)
* **Backend**: Render (FastAPI Web Service)
* **Database**: Render PostgreSQL / Supabase / Neon
* **Source Code**: GitHub

---

### Step 1: Push Code to GitHub

1. Initialize Git repository and verify sensitive files are ignored:
```bash
git init
git status
```
Ensure `.env`, `venv/`, `node_modules/`, `dist/`, `uploads/`, and `*.db` are **NOT** tracked.

2. Stage and commit:
```bash
git add .
git commit -m "Prepare ChatFlow for deployment"
```

3. Push to your GitHub repository:
```bash
git remote add origin https://github.com/your-username/chatflow.git
git branch -M main
git push -u origin main
```

---

### Step 2: Create a PostgreSQL Database

You can provision a managed PostgreSQL database on **Render**, **Supabase**, or **Neon**:

#### Option A: Render PostgreSQL
1. On Render Dashboard, click **New +** $\rightarrow$ **PostgreSQL**.
2. Name: `chatflow-db`
3. Region: Select the region closest to your users (e.g. Oregon or Frankfurt).
4. Plan: Free or Starter.
5. Click **Create Database**.
6. Copy the **Internal Database URL** (if deploying backend on Render) or **External Database URL**.

#### Option B: Supabase PostgreSQL
1. Create a project at [supabase.com](https://supabase.com).
2. Under Project Settings $\rightarrow$ Database, copy the **Connection string (URI)**.
   *(Note: If the URI starts with `postgres://`, ChatFlow's `app/database.py` automatically normalizes it to `postgresql://`)*.

---

### Step 3: Deploy Backend to Render

1. On the Render Dashboard, click **New +** $\rightarrow$ **Web Service**.
2. Connect your GitHub repository (`chatflow`).
3. Configure settings:
   * **Name**: `chatflow-backend`
   * **Region**: Same region as your database
   * **Root Directory**: `chatflow/backend` (or `backend` if repository root is chatflow)
   * **Runtime**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add **Environment Variables**:
   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `PYTHON_VERSION` | `3.12.0` | Python runtime version |
   | `DATABASE_URL` | `postgresql://user:pass@host:5432/dbname` | Your PostgreSQL database URL |
   | `SECRET_KEY` | *(Generate a 32+ char random string)* | JWT signature secret |
   | `ALGORITHM` | `HS256` | JWT algorithm |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `43200` | Token expiration (30 days) |
   | `FRONTEND_URL` | `http://localhost:5173` | *(Update with your Vercel URL in Step 5)* |
   | `UPLOAD_DIR` | `uploads` | Local upload directory |
   | `MAX_UPLOAD_SIZE` | `26214400` | 25MB maximum upload limit |
5. Click **Create Web Service**.
6. Once deployed, note your backend URL:
   `https://chatflow-backend.onrender.com`

Verify backend status:
* Health: `https://chatflow-backend.onrender.com/health` $\rightarrow$ `{"status": "ok", "database": "connected"}`
* Swagger Docs: `https://chatflow-backend.onrender.com/docs`

---

### Step 4: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New...** $\rightarrow$ **Project**.
2. Import your GitHub repository (`chatflow`).
3. Configure the project:
   * **Framework Preset**: `Vite`
   * **Root Directory**: Click *Edit* and select `chatflow/frontend` (or `frontend`)
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. Add **Environment Variables**:
   | Variable | Value | Example |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | Your Render Backend URL | `https://chatflow-backend.onrender.com` |
   | `VITE_WS_URL` | Your Render WebSocket URL (`wss://`) | `wss://chatflow-backend.onrender.com` |
5. Click **Deploy**.
6. Once complete, note your Vercel URL:
   `https://chatflow-app.vercel.app`

*(Note: `frontend/vercel.json` is already included to handle SPA routing, preventing 404s when refreshing `/login`, `/register`, or `/chat/:id`)*.

---

### Step 5: Update CORS & Finalize Deployment

1. Return to the **Render Dashboard** $\rightarrow$ `chatflow-backend` $\rightarrow$ **Environment**.
2. Update `FRONTEND_URL` with your production Vercel domain:
   ```env
   FRONTEND_URL=https://chatflow-app.vercel.app,http://localhost:5173
   ```
3. Save changes (Render will trigger a quick zero-downtime redeploy).

---

### Step 6: Production Verification Checklist

* [x] **Authentication**: Register a new user, log in, verify JWT token persistence.
* [x] **New Chat Privacy**: Search `@username` or phone digits. Verify no user list is displayed when search input is empty.
* [x] **Privacy Settings**: Update Last Seen or Profile Photo under Settings $\rightarrow$ Privacy; verify visibility rules apply.
* [x] **Real-Time WebSockets**: Open two browser tabs (User A and User B). Send a message; verify real-time receipt without page reload.
* [x] **Message Status Ticks**: Single tick (`✓`) $\rightarrow$ Double grey (`✓✓`) $\rightarrow$ Double blue (`✓✓`).
* [x] **Voice Messages**: Click microphone icon, grant browser audio permission, record audio (`🔴 00:05`), send and play audio bubble.
* [x] **File & Photo Attachments**: Send an image and PDF; verify lightbox zoom and file download.
* [x] **React Router Refresh**: Refresh on `/login` and active chat routes; confirm no 404 errors.

---

## ⚠️ File Upload & Storage Architecture Notice

Render web services use an **ephemeral disk**. Any files uploaded locally (images, voice notes, documents stored in `uploads/`) will be lost if the Render instance is restarted or redeployed.

* **For Development / Demonstrations**: The existing local disk storage (`uploads/`) works out of the box.
* **For Permanent Production Media**: Replace local file saving in `app/routers/uploads.py` with an S3-compatible cloud bucket (AWS S3, Cloudflare R2, Supabase Storage, or Cloudinary). The messaging architecture stores `file_url`, meaning only the upload endpoint needs to point to the cloud bucket URL without modifying chat logic.

---

## License
MIT License. Built for educational and demonstration purposes.
