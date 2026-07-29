"""Pydantic models for AI pipeline results (Spec Section 5.3)."""
from typing import Literal, Optional

from pydantic import BaseModel


class ClassificationResult(BaseModel):
    classification: Literal["interested", "not_interested", "ooo", "referral", "question", "unsubscribe"]
    confidence: float
    sentiment: Literal["positive", "neutral", "negative"]
    key_intent: str
    extracted_referral: Optional[dict] = None
    suggested_action: str
    needs_review: bool
    model_version: str


class CriterionScore(BaseModel):
    score: int
    max: int
    detail: str


class ScoringResult(BaseModel):
    score: int
    qualified: bool
    breakdown: dict[str, CriterionScore]
    reasoning: str
    model_version: str


class SequenceStep(BaseModel):
    step_number: int
    subject: str
    body: str
