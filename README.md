# DebateCoach — AI Argument Analyzer & Debate Arena

Dissect any argument. Win any debate. Powered by Google Gemini 2.0 Flash.

> **Screenshots placeholder** — run the app and paste a screenshot here.

---

## Features

- **Argument Analysis** — paste any text and get a full breakdown: main claim, premises, conclusion, logical fallacies, strong points, weak points, and an argument strength score (1–10)
- **Fact Checking** — verify the main claim and premises against AI knowledge
- **Live Debate Arena** — debate the AI in real-time with streaming responses; the AI takes the opposite side and challenges every weak argument
- **Argument Tracker** — live list of your key points and AI counter-arguments extracted per turn
- **Debate Scoring** — impartial judge scores both sides on logic, evidence, and rhetoric with actionable improvement tips
- **Dark UI** — polished dark theme with framer-motion animations throughout

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Animations | Framer Motion |
| Icons | Lucide React |
| Markdown | React Markdown |
| Backend | FastAPI, Python 3.11+ |
| AI | Google Gemini 2.0 Flash via `google-generativeai` |
| Streaming | Server-Sent Events (SSE) |
| Runtime | Uvicorn (ASGI) |

---

## Setup

### 1. Get a Gemini API Key

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click **Get API key** → **Create API key**
3. Copy the key

### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and paste your GEMINI_API_KEY
```

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# .env.local already points to http://localhost:8000 — no changes needed for local dev
```

---

## Run Locally

**Terminal 1 — Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## How it works

1. **Land** — Paste any text (article, speech, claim) into the textarea
2. **Analyze** — Click "Analyze argument" → the AI breaks it down into premises, fallacies, strong/weak points with a strength score
3. **Fact-check** — Click "Fact-check claims with AI" to verify the main claim and premises
4. **Debate** — Click "Debate this topic →" to enter the arena; choose your side; debate the AI with real-time streaming responses
5. **Score** — Click "Get Score" at any point for an impartial breakdown of who won and why

---

## Project Structure

```
debate-coach/
├── README.md
├── backend/
│   ├── main.py          # FastAPI app + all endpoints
│   ├── models.py        # Pydantic request/response models
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx          # Landing page
    │   │   ├── analyze/page.tsx  # Argument analysis
    │   │   └── debate/page.tsx   # Debate arena
    │   ├── components/
    │   │   ├── CircularProgress.tsx
    │   │   ├── ScoreModal.tsx
    │   │   ├── SkeletonCard.tsx
    │   │   └── ToastContext.tsx
    │   ├── context/
    │   │   └── AnalysisContext.tsx
    │   └── types/index.ts
    ├── package.json
    └── .env.local.example
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/analyze` | Analyze an argument for structure, fallacies, and strength |
| POST | `/api/factcheck` | Fact-check a list of claims |
| POST | `/api/debate/start` | Start a new debate session |
| POST | `/api/debate/respond` | Get a streaming AI rebuttal |
| POST | `/api/debate/score` | Score the completed debate |
