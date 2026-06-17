# 🧠 Interview Preparation AI Coach

> A full-stack AI-powered interview preparation platform built with **FastAPI + React + Groq LLaMA 3.1**

![Stack](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)
![Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat&logo=react)
![Stack](https://img.shields.io/badge/AI-Groq%20LLaMA%203.1-orange?style=flat)
![Stack](https://img.shields.io/badge/DB-SQLite-003B57?style=flat&logo=sqlite)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Auth** | JWT-based registration and login |
| 📄 **Resume Upload** | Upload PDF/DOCX — auto-parsed with LLM |
| 🎯 **ATS Scoring** | Semantic skill matching + missing skills + AI suggestions |
| 🤖 **Interview Generation** | Role + difficulty + resume-tailored questions via Groq |
| 💬 **Mock Interview** | Chat-style question flow with real-time AI evaluation |
| 📊 **Scoring** | Correctness (40%) · Communication (30%) · Relevance (30%) |
| 🗺️ **AI Roadmap** | Phased learning plan with resources and milestones |
| 📈 **Dashboard** | Trend charts, radar chart, weak area analysis |
| 📥 **PDF Export** | Beautiful styled performance report download |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────┐
│       Frontend (React + Vite)        │
│  Dark UI · Tailwind · Framer Motion  │
└────────────────┬─────────────────────┘
                 │ REST API
┌────────────────▼─────────────────────┐
│         Backend (FastAPI)            │
│   Auth · Resume · Interview · Export │
├──────────────────────────────────────┤
│   AI Layer                           │
│   ├── Groq llama-3.1-8b-instant     │
│   ├── Sentence Transformers (MiniLM) │
│   └── scikit-learn (skill matching)  │
├──────────────────────────────────────┤
│   SQLite + SQLAlchemy ORM            │
└──────────────────────────────────────┘
```

---

## 📁 Project Structure

```
interview-prep-coach/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI entry
│   │   ├── config.py          # Settings
│   │   ├── database.py        # SQLAlchemy async
│   │   ├── models/            # ORM models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── routers/           # API routes
│   │   ├── services/          # Business logic
│   │   ├── ai/                # LLM + embeddings + skill matcher
│   │   └── utils/             # PDF/DOCX parsers, JWT
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── pages/             # 7 pages
│   │   ├── components/        # UI + Layout components
│   │   ├── api/               # Axios API clients
│   │   ├── store/             # Zustand state
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── .env
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Groq API key → [console.groq.com](https://console.groq.com)

### 1. Clone & Configure

```bash
git clone <repo-url>
cd interview-prep-coach
```

Edit `.env` and set your Groq API key:
```env
GROQ_API_KEY=your_key_here
SECRET_KEY=your-32-char-secret
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start server
python run.py
```

Backend runs at: **http://localhost:8000**
API Docs: **http://localhost:8000/docs**

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🔌 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register user |
| POST | `/api/auth/login` | ❌ | Login → JWT |
| GET  | `/api/auth/me` | ✅ | Current user |
| POST | `/api/resume/upload` | ✅ | Upload PDF/DOCX |
| GET  | `/api/resume/` | ✅ | List resumes |
| GET  | `/api/resume/{id}` | ✅ | Get resume |
| POST | `/api/resume/{id}/ats-score` | ✅ | ATS score |
| POST | `/api/interview/start` | ✅ | Start session |
| GET  | `/api/interview/{id}` | ✅ | Get session |
| POST | `/api/interview/{id}/answer` | ✅ | Submit answer |
| GET  | `/api/interview/{id}/summary` | ✅ | Session summary |
| GET  | `/api/dashboard/` | ✅ | Dashboard stats |
| POST | `/api/dashboard/roadmap` | ✅ | Generate roadmap |
| GET  | `/api/export/{id}/pdf` | ✅ | Export PDF |

---

## 🧠 AI Components

### LLM (Groq llama-3.1-8b-instant)
- Resume parsing (structured extraction)
- Question generation (role/difficulty/resume-aware)
- Answer evaluation (correctness, communication, relevance)
- ATS suggestions and summaries
- Learning roadmap generation

### Sentence Transformers (all-MiniLM-L6-v2)
- Semantic skill matching (80MB, runs locally)
- 384-dim embeddings, normalized dot-product similarity

### scikit-learn
- Cosine similarity for skill gap analysis
- Role-to-skills mapping with threshold matching

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GROQ_API_KEY` | — | **Required** Groq API key |
| `GROQ_MODEL` | `llama-3.1-8b-instant` | LLM model |
| `SECRET_KEY` | — | **Required** JWT secret (32+ chars) |
| `DATABASE_URL` | SQLite local | DB connection string |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed origins |
| `MAX_FILE_SIZE_MB` | `10` | Max upload size |

---

## 📊 DB Schema

```
users ──< resumes ──< interview_sessions ──< interview_questions
                                        └──< interview_attempts
users ──< learning_roadmaps
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS v3, Framer Motion, Recharts |
| State | Zustand |
| HTTP | Axios |
| Backend | FastAPI, Python 3.11, uvicorn |
| Auth | python-jose (JWT), passlib (bcrypt) |
| Database | SQLite, SQLAlchemy 2.0 (async) |
| AI/LLM | Groq (llama-3.1-8b-instant) |
| Embeddings | Sentence Transformers (all-MiniLM-L6-v2) |
| ML | scikit-learn |
| PDF Parse | pdfminer.six, PyPDF2, python-docx |
| PDF Export | ReportLab |

---

## 📄 License

MIT © 2024 Interview Prep Coach
