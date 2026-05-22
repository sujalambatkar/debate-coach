import os
import uuid
import json
import queue
import asyncio
import logging
import threading
import time
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from groq import Groq
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from models import (
    AnalyzeRequest, AnalyzeResponse,
    FactCheckRequest, FactCheckResponse, FactCheckResult,
    DebateStartRequest, DebateStartResponse,
    DebateRespondRequest, DebateScoreRequest, DebateScoreResponse,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not set in environment")

client = Groq(api_key=GROQ_API_KEY)
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="AI Debate Coach API", docs_url=None, redoc_url=None)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response


MODEL_NAME = "llama-3.3-70b-versatile"
SESSION_TTL = 7200  # 2 hours
MAX_SESSIONS = 500
sessions: dict = {}


def _cleanup_sessions() -> None:
    now = time.time()
    expired = [sid for sid, s in list(sessions.items()) if now - s["created_at"] > SESSION_TTL]
    for sid in expired:
        del sessions[sid]


def sanitize(text: str) -> str:
    """Strip null bytes and non-printable control characters."""
    return "".join(c for c in text if c >= " " or c in "\n\r\t")


def chat_json(prompt: str) -> str:
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        timeout=30,
    )
    return response.choices[0].message.content


def chat(prompt: str) -> str:
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
        timeout=30,
    )
    return response.choices[0].message.content


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/analyze", response_model=AnalyzeResponse)
@limiter.limit("10/minute")
async def analyze_argument(request: Request, body: AnalyzeRequest):
    def _run():
        text = sanitize(body.text)
        prompt = f"""You are an expert logician and argument analyst. Analyze the following text thoroughly.

Return a JSON object with EXACTLY this structure:
{{
  "main_claim": "the central claim being argued",
  "premises": ["premise 1", "premise 2", "..."],
  "conclusion": "what the argument concludes",
  "argument_strength": <integer 1-10>,
  "strength_reasoning": "why you gave this strength score",
  "fallacies": [
    {{ "name": "fallacy name", "explanation": "why this is a fallacy here", "quote": "exact quote from text" }}
  ],
  "weak_points": ["weakness 1", "weakness 2"],
  "strong_points": ["strength 1", "strength 2"],
  "topic": "broad topic category (e.g. AI, Climate, Economics)"
}}

If no fallacies are present, return an empty array for fallacies.
Be thorough. Identify 3-6 premises, 2-4 weak points, 2-4 strong points.

Text to analyze:
{text}"""
        return json.loads(chat_json(prompt))

    try:
        data = await asyncio.to_thread(_run)
        return AnalyzeResponse(**data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("analyze error: %s", e)
        raise HTTPException(status_code=500, detail="Analysis failed. Please try again.")


@app.post("/api/factcheck", response_model=FactCheckResponse)
@limiter.limit("10/minute")
async def factcheck(request: Request, body: FactCheckRequest):
    def _check_claim(claim: str) -> FactCheckResult:
        try:
            prompt = f"""Fact-check the following claim. Use your knowledge to determine its accuracy.

Claim: "{sanitize(claim)}"

Respond with ONLY a JSON object (no markdown fences):
{{
  "verdict": "true" or "false" or "disputed" or "unverifiable",
  "explanation": "clear explanation of your verdict with evidence",
  "sources": ["source description 1", "source description 2"]
}}

- "true": claim is factually accurate
- "false": claim is demonstrably false
- "disputed": experts or credible sources disagree
- "unverifiable": cannot be verified with available information"""
            data = json.loads(chat_json(prompt))
            return FactCheckResult(
                claim=claim,
                verdict=data.get("verdict", "unverifiable"),
                explanation=data.get("explanation", ""),
                sources=data.get("sources", []),
            )
        except Exception as e:
            logger.warning("factcheck claim error: %s", e)
            return FactCheckResult(
                claim=claim,
                verdict="unverifiable",
                explanation="Unable to verify this claim.",
                sources=[],
            )

    def _run():
        return [_check_claim(c) for c in body.claims[:5]]

    try:
        results = await asyncio.to_thread(_run)
        return FactCheckResponse(results=results)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("factcheck error: %s", e)
        raise HTTPException(status_code=500, detail="Fact-check failed. Please try again.")


@app.post("/api/debate/start", response_model=DebateStartResponse)
@limiter.limit("5/minute")
async def debate_start(request: Request, body: DebateStartRequest):
    def _run():
        _cleanup_sessions()
        if len(sessions) >= MAX_SESSIONS:
            raise HTTPException(status_code=503, detail="Server at capacity. Please try again later.")
        ai_side = "against" if body.user_side == "for" else "for"
        topic = sanitize(body.topic)
        context_note = (
            f"\nAdditional context: {sanitize(body.argument_context)}"
            if body.argument_context
            else ""
        )
        prompt = f"""You are an expert debater and rhetorician.
Topic: "{topic}"
Your position: {ai_side.upper()} the motion{context_note}

Generate a compelling, authoritative opening statement (2-3 paragraphs).
Be specific, cite real-world examples, and lay out your strongest arguments.
Be direct, confident, and set the intellectual tone for the debate."""
        return ai_side, chat(prompt).strip()

    try:
        ai_side, opening = await asyncio.to_thread(_run)
        session_id = str(uuid.uuid4())
        sessions[session_id] = {
            "topic": sanitize(body.topic),
            "user_side": body.user_side,
            "ai_side": ai_side,
            "history": [{"role": "assistant", "content": opening}],
            "created_at": time.time(),
        }
        return DebateStartResponse(
            session_id=session_id,
            opening_statement=opening,
            ai_side=ai_side,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("debate start error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to start debate. Please try again.")


@app.post("/api/debate/respond")
@limiter.limit("20/minute")
async def debate_respond(request: Request, body: DebateRespondRequest):
    if body.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[body.session_id]
    user_message = sanitize(body.user_message)
    history_text = "\n\n".join(
        f"{'AI' if m['role'] == 'assistant' else 'USER'}: {m['content']}"
        for m in session["history"]
    )

    prompt = f"""You are an expert debater arguing {session['ai_side'].upper()} the motion: "{session['topic']}".

Debate history:
{history_text}

Your opponent (arguing {session['user_side'].upper()}) just said:
"{user_message}"

Generate a sharp, incisive rebuttal. Be Socratic — ask probing questions. Cite specific real-world examples, statistics, or historical events. Never let a weak argument slide. Challenge faulty premises, expose logical fallacies, and make your own positive case. Keep it to 2-3 focused paragraphs."""

    token_queue: queue.Queue = queue.Queue()
    full_response: list[str] = []

    def _stream():
        try:
            stream = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
                stream=True,
                timeout=60,
            )
            for chunk in stream:
                text = chunk.choices[0].delta.content
                if text:
                    token_queue.put(text)
                    full_response.append(text)
            token_queue.put(None)
        except Exception as e:
            token_queue.put(RuntimeError(str(e)))

    async def generate():
        loop = asyncio.get_event_loop()
        t = threading.Thread(target=_stream, daemon=True)
        t.start()

        while True:
            token = await loop.run_in_executor(None, token_queue.get)
            if token is None:
                break
            if isinstance(token, Exception):
                logger.error("stream error: %s", token)
                yield f"data: {json.dumps({'error': 'Streaming failed. Please try again.'})}\n\n"
                return
            yield f"data: {json.dumps({'token': token})}\n\n"

        t.join()
        ai_text = "".join(full_response)
        sessions[body.session_id]["history"].append({"role": "user", "content": user_message})
        sessions[body.session_id]["history"].append({"role": "assistant", "content": ai_text})

        def _extract_claims():
            try:
                ep = f"""Extract the single core argument claim (one concise sentence) from each message.
Return ONLY JSON: {{"user_claim": "...", "ai_claim": "..."}}

User message: {user_message[:400]}
AI response: {ai_text[:400]}"""
                return json.loads(chat_json(ep))
            except Exception:
                return {"user_claim": user_message[:80], "ai_claim": ai_text[:80]}

        claims = await loop.run_in_executor(None, _extract_claims)
        yield f"data: {json.dumps({'done': True, 'user_claim': claims.get('user_claim', ''), 'ai_claim': claims.get('ai_claim', '')})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/debate/score", response_model=DebateScoreResponse)
@limiter.limit("10/minute")
async def debate_score(request: Request, body: DebateScoreRequest):
    if body.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions[body.session_id]

    def _run():
        history_text = "\n\n".join(
            f"{'AI' if m['role'] == 'assistant' else 'USER'}: {m['content']}"
            for m in session["history"]
        )
        prompt = f"""You are an impartial debate judge. Evaluate this debate.

Topic: "{session['topic']}"
User argued: {session['user_side'].upper()}
AI argued: {session['ai_side'].upper()}

Full debate transcript:
{history_text}

Return a JSON object with EXACTLY this structure:
{{
  "user_score": <integer 1-10>,
  "ai_score": <integer 1-10>,
  "user_strengths": ["strength 1", "strength 2", "strength 3"],
  "user_weaknesses": ["weakness 1", "weakness 2"],
  "best_argument": "the single best argument made in the entire debate, by either side",
  "verdict": "a 2-3 sentence summary of who won and why",
  "improvement_tips": ["tip 1", "tip 2", "tip 3"]
}}

Be fair, rigorous, and specific. Base scores on logic, evidence, and rhetoric."""
        return json.loads(chat_json(prompt))

    try:
        data = await asyncio.to_thread(_run)
        return DebateScoreResponse(**data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("score error: %s", e)
        raise HTTPException(status_code=500, detail="Scoring failed. Please try again.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
