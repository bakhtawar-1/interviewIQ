"""
interview_ai.py — FastAPI router for AI interview features

Endpoints:
  POST /api/interview/score-answer     — Score a candidate's answer
  POST /api/interview/upload-cv        — Parse CV and generate questions
  POST /api/interview/questions        — Get role-based questions (no CV)
  POST /api/interview/followup         — Generate follow-up question

Add to main.py:
  from app.api import interview_ai
  app.include_router(interview_ai.router)
"""

import sys
import os

# Add ml directory to path so we can import scorer etc.
ML_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'ml')
sys.path.insert(0, ML_DIR)

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/api/interview", tags=["Interview AI"])


# ── Lazy imports — only load ML modules when endpoints are called ──────────────
def _get_scorer():
    try:
        from scorer import score_answer
        return score_answer
    except Exception as e:
        raise HTTPException(500, f"Scorer not loaded. Run ml/train.py first. Error: {e}")

def _get_parser():
    try:
        from cv_parser import parse_cv
        return parse_cv
    except Exception as e:
        raise HTTPException(500, f"CV parser error: {e}")

def _get_generator():
    try:
        from question_generator import (
            generate_questions_from_cv,
            generate_questions_from_role,
            generate_followup,
        )
        return generate_questions_from_cv, generate_questions_from_role, generate_followup
    except Exception as e:
        raise HTTPException(500, f"Question generator error: {e}")


# ── Request/Response models ───────────────────────────────────────────────────

class ScoreRequest(BaseModel):
    question: str
    answer: str
    keywords: Optional[List[str]] = []
    ideal_answer: Optional[str] = ""

class QuestionsRequest(BaseModel):
    role: Optional[str] = ""
    category: Optional[str] = "mixed"   # behavioral | technical | hr | mixed
    count: Optional[int] = 5

class FollowupRequest(BaseModel):
    previous_question: str
    previous_answer: str
    score: int
    breakdown: Optional[dict] = {}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/score-answer")
async def score_answer_endpoint(req: ScoreRequest):
    """
    Score a candidate's answer using sentence-transformers (via evaluation_service).

    Returns:
      score (0-100), feedback (string), breakdown (dict)
    """
    if not req.answer or not req.answer.strip():
        return {"score": 0, "feedback": "No answer provided.", "breakdown": {}}

    from app.services.evaluation_service import score_response
    score, feedback = score_response(req.answer, req.ideal_answer, req.keywords)
    
    return {
        "score": score,
        "feedback": feedback,
        "breakdown": {}
    }


@router.post("/upload-cv")
async def upload_cv(file: UploadFile = File(...)):
    """
    Upload a CV/Resume (PDF, DOCX, or TXT).
    Returns parsed CV data + 5 interview questions tailored to the CV.
    """
    allowed = {'.pdf', '.docx', '.txt', '.doc'}
    ext     = os.path.splitext(file.filename or '')[1].lower()

    if ext not in allowed:
        raise HTTPException(400, f"File type '{ext}' not supported. Upload PDF, DOCX, or TXT.")

    # Read file
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(400, "File too large. Maximum size is 5MB.")

    # Parse CV
    parse_fn = _get_parser()
    try:
        cv_data = parse_fn(contents, file.filename)
    except Exception as e:
        raise HTTPException(500, f"Failed to parse CV: {e}")

    # Check if CV is valid (ATS resume, not assignment/report)
    if not cv_data.get('is_valid', True):
        return JSONResponse(
            status_code=422,
            content={
                "error": cv_data.get('error', 'Invalid document'),
                "cv": {"is_valid": False, "error": cv_data.get('error', 'Invalid document')},
                "questions": [],
            }
        )

    # Generate questions
    gen_from_cv, _, _ = _get_generator()
    try:
        questions = gen_from_cv(cv_data, count=5)
    except Exception as e:
        raise HTTPException(500, f"Failed to generate questions: {e}")

    return {
        "cv": {
            "is_valid":         True,
            "warnings":         cv_data.get('warnings', []),
            "name":             cv_data.get('name', ''),
            "email":            cv_data.get('email', ''),
            "skills":           cv_data.get('skills', []),
            "job_titles":       cv_data.get('job_titles', []),
            "experience_years": cv_data.get('experience_years', 0),
            "education":        cv_data.get('education', []),
            "summary":          cv_data.get('cv_summary', ''),
            "word_count":       cv_data.get('word_count', 0),
        },
        "questions": questions,
        "message": f"Generated {len(questions)} questions from your CV"
    }


@router.post("/questions")
async def get_questions(req: QuestionsRequest):
    """
    Get shuffled interview questions based on role and category.
    Questions are different every time (shuffled).
    """
    _, gen_from_role, _ = _get_generator()
    questions = gen_from_role(
        role=req.role or '',
        category=req.category or 'mixed',
        count=min(req.count or 5, 30),
    )
    return {
        "questions": questions,
        "count": len(questions),
        "role": req.role,
        "category": req.category,
    }


@router.post("/followup")
async def get_followup(req: FollowupRequest):
    """
    Generate a contextual follow-up question based on the candidate's answer.
    Returns null if no follow-up is needed (answer was complete).
    """
    _, _, gen_followup = _get_generator()
    followup = gen_followup(
        previous_question=req.previous_question,
        previous_answer=req.previous_answer,
        score=req.score,
        breakdown=req.breakdown or {},
    )
    return {
        "followup": followup,
        "has_followup": followup is not None,
    }


@router.get("/health")
async def health():
    """Check if ML components are loaded correctly"""
    status = {}

    try:
        score_fn = _get_scorer()
        test     = score_fn("test question", "test answer with some content about working hard")
        status['scorer'] = f"OK (test score: {test['score']})"
    except Exception as e:
        status['scorer'] = f"ERROR: {e}"

    try:
        _, gen_from_role, _ = _get_generator()
        qs = gen_from_role("developer", "mixed", 2)
        status['question_generator'] = f"OK (generated {len(qs)} questions)"
    except Exception as e:
        status['question_generator'] = f"ERROR: {e}"

    return status
