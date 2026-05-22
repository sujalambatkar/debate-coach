from pydantic import BaseModel, Field, field_validator
from typing import List


class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=5000)

    @field_validator("text")
    @classmethod
    def strip_text(cls, v: str) -> str:
        return v.strip()


class Fallacy(BaseModel):
    name: str
    explanation: str
    quote: str


class AnalyzeResponse(BaseModel):
    main_claim: str
    premises: List[str]
    conclusion: str
    argument_strength: int
    strength_reasoning: str
    fallacies: List[Fallacy]
    weak_points: List[str]
    strong_points: List[str]
    topic: str


class FactCheckRequest(BaseModel):
    text: str = Field(..., max_length=5000)
    claims: List[str] = Field(..., max_items=10)

    @field_validator("claims")
    @classmethod
    def cap_claims(cls, v: List[str]) -> List[str]:
        return [c[:500] for c in v]


class FactCheckResult(BaseModel):
    claim: str
    verdict: str
    explanation: str
    sources: List[str] = []


class FactCheckResponse(BaseModel):
    results: List[FactCheckResult]


class DebateStartRequest(BaseModel):
    topic: str = Field(..., min_length=5, max_length=500)
    user_side: str = Field(..., pattern="^(for|against)$")
    argument_context: str = Field(default="", max_length=1000)

    @field_validator("topic")
    @classmethod
    def strip_topic(cls, v: str) -> str:
        return v.strip()


class DebateStartResponse(BaseModel):
    session_id: str
    opening_statement: str
    ai_side: str


class DebateRespondRequest(BaseModel):
    session_id: str = Field(..., min_length=36, max_length=36)
    user_message: str = Field(..., min_length=1, max_length=2000)

    @field_validator("user_message")
    @classmethod
    def strip_message(cls, v: str) -> str:
        return v.strip()


class DebateScoreRequest(BaseModel):
    session_id: str = Field(..., min_length=36, max_length=36)


class DebateScoreResponse(BaseModel):
    user_score: int
    ai_score: int
    user_strengths: List[str]
    user_weaknesses: List[str]
    best_argument: str
    verdict: str
    improvement_tips: List[str]
