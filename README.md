# SOP Expert AI

**Upload any SOP and chat with an AI expert grounded only in your documents.**

Built by [Habib Ul Haq](https://portfolio-website-nr8v.vercel.app/)

---

## Features

- **AI-Powered Q&A** — Chat with your SOPs using GPT-4o Mini, GPT-4o, or GPT-4 Turbo
- **No Hallucination** — Answers are strictly grounded in your uploaded documents
- **Multi-Format Support** — PDF, DOCX, TXT, Markdown
- **Smart Formatting** — Auto-selects tables, steps, bullets, or paragraphs
- **Cited References** — Every answer includes source file and confidence score
- **Authentication** — Sign up, login, profile management, password reset
- **Admin Dashboard** — View app stats, users, and documents (admin only)
- **Password Reset** — Email delivery via SMTP with on-screen fallback
- **Dark Mode** — Light/Dark/System theme support

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- [OpenRouter API key](https://openrouter.ai/) (or any OpenAI-compatible API key)

### 1. Clone & Setup

```bash
git clone <repo-url>
cd sop-expert-reader
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenRouter / OpenAI API key | — |
| `OPENAI_API_BASE` | API base URL | `https://openrouter.ai/api/v1` |
| `OPENAI_LLM_MODEL` | Default LLM model | `gpt-4o-mini` |
| `DEBUG` | Enable debug logging | `true` |
| `CORS_ORIGINS` | Allowed CORS origins | `["http://localhost:3000"]` |
| `JWT_SECRET_KEY` | JWT signing secret | `change-this-to-a-secure-random-secret-in-production` |
| `ADMIN_EMAIL` | Email of the admin user | `habib@example.com` |
| `FRONTEND_URL` | Frontend URL for reset links | `http://localhost:3000` |
| `SMTP_HOST` | SMTP server for password reset emails | *(empty = on-screen fallback)* |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USERNAME` | SMTP login | — |
| `SMTP_PASSWORD` | SMTP password / API key | — |
| `SMTP_FROM_EMAIL` | Sender email address | — |

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |

---

## Project Structure

```
sop-expert-reader/
├── frontend/                          # Next.js App (TypeScript + Tailwind)
│   ├── app/
│   │   ├── (auth)/                    # Public auth routes
│   │   │   ├── login/                 # Sign in page
│   │   │   ├── signup/                # Create account page
│   │   │   ├── forgot-password/       # Password reset request
│   │   │   └── reset-password/        # Password reset form
│   │   ├── (app)/                     # Protected routes (auth required)
│   │   │   ├── dashboard/             # User dashboard with stats
│   │   │   ├── documents/             # Document list with search & sort
│   │   │   ├── upload/                # Drag & drop upload with progress
│   │   │   ├── chat/                  # Streaming AI chat interface
│   │   │   ├── profile/               # Account settings & change password
│   │   │   └── admin/                 # Admin dashboard (admin only)
│   │   ├── page.tsx                   # Landing page
│   │   ├── layout.tsx                 # Root layout
│   │   └── globals.css                # Global styles & animations
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── navbar.tsx             # Top navbar with user dropdown
│   │   │   └── sidebar.tsx            # Sidebar with nav & user card
│   │   ├── auth-provider.tsx          # Auth context (login/signup/logout)
│   │   ├── theme-provider.tsx         # Light/Dark/System theme
│   │   └── logo.tsx                   # App logo SVG
│   ├── services/
│   │   └── api.ts                     # API client with auth headers
│   └── types/
│       └── index.ts                   # TypeScript type definitions
│
├── backend/                           # FastAPI (Python)
│   ├── app/
│   │   ├── main.py                    # FastAPI entry point & CORS
│   │   ├── config.py                  # Settings (pydantic-settings)
│   │   ├── database.py                # SQLAlchemy engine & migrations
│   │   ├── api/
│   │   │   ├── auth.py                # Auth endpoints (signup, login, profile, password reset)
│   │   │   ├── admin.py               # Admin endpoints (stats, users, documents)
│   │   │   ├── routes.py              # Document & chat endpoints
│   │   │   └── dependencies.py        # Shared dependencies
│   │   ├── services/
│   │   │   ├── email_service.py       # SMTP email sending (password reset)
│   │   │   ├── document_processor.py  # PDF/DOCX/TXT/MD parsing
│   │   │   ├── embedding_service.py   # Local embeddings (fastembed)
│   │   │   ├── vector_store.py        # ChromaDB operations
│   │   │   └── chat_service.py        # RAG chat (retrieval + LLM)
│   │   ├── models/
│   │   │   ├── domain.py              # SQLAlchemy models (User, Document, Conversation, Message)
│   │   │   └── schemas.py             # Pydantic request/response models
│   │   └── utils/
│   │       └── helpers.py             # Logging utilities
│   ├── uploads/                       # Uploaded files (gitignored)
│   ├── chroma_db/                     # Vector store (gitignored)
│   ├── requirements.txt
│   └── runtime.txt                    # Python version (3.11)
│
├── .gitignore
├── render.yaml                        # Render deployment config
├── railway.json                       # Railway deployment config
└── README.md
```

---

## How It Works

```
User Uploads SOP -> Text Extraction -> Chunking -> Embeddings -> ChromaDB
                                                                |
User Asks Question -> Semantic Search -> Retrieve Context -> LLM -> Answer + References
```

### AI Behavior

- **Grounded answers only** — The AI is constrained to answer using only the retrieved SOP context
- **No hallucination** — If information isn't in the documents, it politely says so
- **Smart formatting** — Automatically uses tables, steps, bullets, or paragraphs based on query type
- **Citations** — Every answer includes file name, page number, and confidence score

---

## API Endpoints

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | No | Register a new user |
| POST | `/api/auth/login` | No | Sign in, returns JWT |
| GET | `/api/auth/me` | Yes | Get current user profile |
| PUT | `/api/auth/me` | Yes | Update profile name |
| POST | `/api/auth/forgot-password` | No | Request password reset |
| POST | `/api/auth/reset-password` | No | Reset password with token |
| PUT | `/api/auth/change-password` | Yes | Change password (requires current) |

### Documents

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/upload` | Yes | Upload a document (PDF, DOCX, TXT, MD) |
| GET | `/api/list` | Yes | List user's documents |
| DELETE | `/api/delete` | Yes | Delete a document |
| GET | `/api/upload-status/{id}` | Yes | Poll document processing status |

### Chat & AI

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/chat` | Yes | Chat with your SOPs |
| POST | `/api/chat/stream` | Yes | Streaming chat (SSE) |
| POST | `/api/summarize` | Yes | Summarize a document |
| POST | `/api/quiz` | Yes | Generate quiz questions |
| POST | `/api/flowchart` | Yes | Extract process steps |
| POST | `/api/search` | Yes | Search within documents |

### Admin (admin only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats` | App statistics (users, documents, storage, etc.) |
| GET | `/api/admin/users` | List all users with document/conversation counts |
| GET | `/api/admin/documents` | List all documents across all users |

### System

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui |
| Backend | FastAPI, Python 3.11 |
| LLM | OpenAI models via OpenRouter (GPT-4o Mini, GPT-4o, GPT-4 Turbo) |
| Embeddings | Local fastembed (BAAI/bge-small-en-v1.5) — no API key needed |
| Vector DB | ChromaDB (persistent) |
| Document Parsing | PyMuPDF (PDF), python-docx (DOCX) |
| Database | SQLite via SQLAlchemy + aiosqlite |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Email | SMTP via smtplib (Gmail, Brevo, SendGrid, etc.) |

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
vercel deploy
```

Set `NEXT_PUBLIC_API_URL` to your backend URL in Vercel env vars.

### Backend → Railway / Render

The backend is compatible with Railway and Render.

For Railway:
```bash
# Railway auto-detects requirements.txt
# Set start command: cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
# Set OPENAI_API_KEY and other env vars in Railway dashboard
```

For Render:
```bash
# Create a Web Service
# Build Command: pip install -r backend/requirements.txt
# Start command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
# Set OPENAI_API_KEY and other env vars in Render dashboard
```

---

## Admin Setup

1. Set `ADMIN_EMAIL` in `backend/.env` to your email address
2. Sign up with that email
3. Restart the backend — the migration automatically marks you as admin
4. The **Admin** link (shield icon) appears in the sidebar

---

## Password Reset Emails

The forgot password flow supports two modes:

### 1. On-screen link (no setup required — default)
Just leave `SMTP_HOST` empty. When a user requests a password reset, the link is displayed on screen with a copy button.

### 2. Email delivery (requires SMTP)
Configure SMTP settings in `backend/.env`:
- **Gmail** — Use an [App Password](https://support.google.com/accounts/answer/185833) (requires 2FA enabled)
- **Brevo** — Free tier (300 emails/day), get SMTP credentials from SMTP & API > SMTP keys
- **SendGrid** — 60-day trial, then paid

Example for Gmail:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
FRONTEND_URL=https://your-app.vercel.app
```

---

## Security

- JWT-based authentication with bcrypt password hashing
- File type validation (only PDF, DOCX, TXT, MD allowed)
- File size limit (50MB max)
- Prompt injection protection via strict system prompts
- API key stored server-side, never exposed to frontend
- Admin routes protected with role-based access control
- Password reset tokens expire after 1 hour
- Email enumeration prevention (generic messages for unknown emails)

---

## License

MIT
