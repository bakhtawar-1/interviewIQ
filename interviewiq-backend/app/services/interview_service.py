"""
services/interview_service.py - Interview Business Logic
==========================================================
Services contain the core business logic — the "brain" of your app.
Endpoints in api/ should be thin (just HTTP handling).
Complex operations go here.

WHY SEPARATE SERVICES?
- Easier to test (no HTTP layer needed)
- Reusable across multiple endpoints
- Cleaner code separation

CURRENT: Basic interview completion logic
PHASE 2: AI scoring will be added here
"""

from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from app.models.interview import Interview, InterviewStatus
from app.models.question import Question
from app.models.response import InterviewResponse, InterviewSummary


def complete_interview(interview_id: int, db: Session) -> InterviewSummary:
    """
    Mark an interview as completed and generate a basic summary.
    
    Steps:
    1. Get all responses for this interview
    2. Calculate a basic average score
    3. Create a summary record
    4. Mark interview as completed
    
    In Phase 2, this will call the AI service for real scoring.
    """
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise ValueError(f"Interview {interview_id} not found")

    # Get all responses for this interview
    responses = db.query(InterviewResponse)\
        .filter(InterviewResponse.interview_id == interview_id)\
        .all()

    if not responses:
        raise ValueError("Cannot complete interview with no responses")

    # Calculate average score from all responses that have scores
    scored_responses = [r for r in responses if r.score is not None]
    avg_score = None
    if scored_responses:
        avg_score = sum(r.score for r in scored_responses) / len(scored_responses)

    # Create summary (basic version — AI will improve this in Phase 2)
    summary = InterviewSummary(
        interview_id=interview_id,
        communication_score=avg_score,
        technical_score=avg_score,
        confidence_score=avg_score,
        strengths="Summary will be AI-generated in Phase 2.",
        weaknesses="Summary will be AI-generated in Phase 2.",
        recommendations="Keep practicing! AI recommendations coming in Phase 2."
    )
    db.add(summary)

    # Update interview status and final score
    interview.status = InterviewStatus.completed
    interview.completed_at = datetime.utcnow()
    interview.overall_score = avg_score

    db.commit()
    db.refresh(summary)
    return summary


def get_questions_for_interview(
    interview_type: str,
    difficulty: str,
    count: int,
    db: Session
) -> List[Question]:
    """
    Pick questions for an interview based on type and difficulty.
    Returns 'count' random questions matching the criteria.
    
    Phase 2: Will use smarter question selection based on job title + AI.
    """
    from app.models.question import QuestionCategory, DifficultyLevel
    import random

    # Map interview type to question categories
    category_map = {
        "behavioral": [QuestionCategory.behavioral, QuestionCategory.situational],
        "technical": [QuestionCategory.technical],
        "hr": [QuestionCategory.hr],
        "mixed": list(QuestionCategory),  # All categories
    }

    categories = category_map.get(interview_type, [QuestionCategory.behavioral])

    questions = db.query(Question)\
        .filter(
            Question.category.in_(categories),
            Question.difficulty == difficulty
        ).all()

    # Return random selection
    if len(questions) <= count:
        return questions
    return random.sample(questions, count)
