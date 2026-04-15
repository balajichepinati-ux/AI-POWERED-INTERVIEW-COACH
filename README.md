# MockMate — AI Interview Coach

An AI-powered interview coaching platform built with React, Express, Claude AI, and Supabase.

## Project Structure

```
Mock_Mate/
├── frontend/    # React + Vite + Tailwind CSS
└── backend/     # Node.js + Express + Claude AI
```

## Quick Start

### Prerequisites
- Node.js 18+
- An Anthropic API key (from console.anthropic.com)
- Optionally: A Supabase project for auth and database

---

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

Fill in your values:
```env
ANTHROPIC_API_KEY=sk-ant-...your key...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
PORT=3001
FRONTEND_URL=http://localhost:5173
```

> **Note:** The app works in demo mode with just `ANTHROPIC_API_KEY`. Supabase is optional — sessions fall back to in-memory storage.

Start the backend:
```bash
npm run dev
```

---

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file:
```bash
cp .env.example .env
```

Fill in:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:3001/api
```

> **Note:** If Supabase is not configured, the app uses demo mode with local storage auth. You can still practice and get AI feedback.

Start the frontend:
```bash
npm run dev
```

The app will open at **http://localhost:5173**

---

## Features

| Feature | Description |
|---------|-------------|
| 🎙️ Voice Input | Browser Web Speech API with live transcription |
| 📄 Resume Upload | PDF/DOCX parsing with AI extraction |
| 🧠 AI Feedback | Claude AI scores 7 dimensions of your answer |
| 📊 Progress Charts | Score trends and category breakdowns |
| 🔐 Google Auth | Supabase OAuth with demo mode fallback |
| 📱 Responsive | Works on desktop, tablet, and mobile |

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/resume/upload` | Upload and parse resume |
| POST | `/api/questions/generate` | Generate personalized questions |
| POST | `/api/analyze` | Analyze interview answer with Claude |
| GET | `/api/sessions` | Get session history |
| POST | `/api/sessions` | Save a session |
| GET | `/api/sessions/stats` | Get score stats and trends |

## AI Feedback Schema

Every `/api/analyze` response returns:

```json
{
  "overallScore": 72,
  "clarityScore": 75,
  "structureScore": 68,
  "confidenceScore": 70,
  "relevanceScore": 80,
  "englishScore": 74,
  "fluencyScore": 66,
  "strengths": ["..."],
  "improvements": ["..."],
  "fillerWords": ["um", "like"],
  "rewriteSuggestion": "...",
  "followUpQuestion": "...",
  "verdict": "Good",
  "shortSummary": "..."
}
```

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, Recharts
- **Backend:** Node.js, Express, Multer, pdf-parse, mammoth
- **AI:** Anthropic Claude (`claude-sonnet-4-5`)
- **Auth/DB:** Supabase (Google OAuth + PostgreSQL)
- **ORM:** Prisma
