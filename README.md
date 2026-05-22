# DebateCoach — AI Argument Analyzer & Debate Arena

> Dissect any argument. Expose fallacies. Win any debate. Powered by Llama 3.3 70B via Groq.

**[Live Demo](https://debate-coach-one.vercel.app)**

---

## What it does

Paste any text — an article, speech, tweet, or claim — and DebateCoach tears it apart:

- **Argument Analysis** — extracts the main claim, premises, and conclusion; scores argument strength 1–10; identifies logical fallacies with exact quotes; lists strong and weak points
- **Fact Checking** — verifies the main claim and each premise against the AI's knowledge with a verdict (true / false / disputed / unverifiable)
- **Live Debate Arena** — choose your side and debate the AI in real time; it takes the opposite position and challenges every weak argument with streaming responses
- **Argument Tracker** — live feed of your key claims vs. AI counter-arguments extracted each turn
- **Debate Scoring** — impartial judge scores both sides on logic, evidence, and rhetoric with actionable improvement tips

---

## Screenshots

> Drop screenshots here after your first run.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Animations | Framer Motion |
| Icons | Lucide React |
| Markdown | React Markdown |
| Backend | FastAPI, Python 3.13 |
| AI | Llama 3.3 70B via Groq API |
| Streaming | Server-Sent Events (SSE) |
| Runtime | Uvicorn (ASGI) |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Running locally

### Prerequisites

- Python 3.11+
- Node.js 18+
- A free [Groq API key](https://console.groq.com)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# paste your GROQ_API_KEY into .env
uvicorn main:app --reload --port 8001
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# .env.local already points to http://localhost:8001
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project structure

```
debate-coach/
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
    │   └── context/
    └── package.json
```

---

## API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/analyze` | Analyze argument structure, fallacies, and strength |
| POST | `/api/factcheck` | Fact-check a list of claims |
| POST | `/api/debate/start` | Start a debate session |
| POST | `/api/debate/respond` | Stream an AI rebuttal |
| POST | `/api/debate/score` | Score the completed debate |

---

## Deploying your own

**Backend → [Render](https://render.com)** (free tier)
- Root directory: `backend`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Env vars: `GROQ_API_KEY`, `ALLOWED_ORIGINS=https://your-app.vercel.app`

**Frontend → [Vercel](https://vercel.com)** (free tier)
- Root directory: `frontend`
- Env vars: `NEXT_PUBLIC_API_URL=https://your-render-service.onrender.com`

---

## License

MIT
