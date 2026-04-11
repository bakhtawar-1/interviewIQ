"""
api/candidate.py - Candidate Endpoints
Now with real AI scoring on every answer submitted!
"""

import json
import logging
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.interview import Interview, InterviewStatus
from app.models.question import Question
from app.models.response import InterviewResponse, InterviewSummary

from app.schemas.interview import (
    InterviewCreate, InterviewOut, ResponseCreate, ResponseOut, SummaryOut, VideoInterviewComplete
)
from app.utils.helpers import get_current_user, require_role
from app.services.evaluation_service import score_response, generate_summary_feedback

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/candidate",
    tags=["Candidate"],
    dependencies=[Depends(require_role([UserRole.candidate, UserRole.admin]))]
)


@router.post("/interviews", response_model=InterviewOut, status_code=201)
def start_interview(
    interview_data: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_interview = Interview(
        user_id=current_user.id,
        interview_type=interview_data.interview_type,
        difficulty=interview_data.difficulty,
        job_title=interview_data.job_title,
        status=InterviewStatus.pending
    )
    db.add(new_interview)
    db.commit()
    db.refresh(new_interview)
    return new_interview


@router.get("/interviews", response_model=List[InterviewOut])
def get_my_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Interview)\
        .filter(Interview.user_id == current_user.id)\
        .order_by(Interview.created_at.desc())\
        .all()


@router.get("/interviews/{interview_id}", response_model=InterviewOut)
def get_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")
    return interview


@router.post("/interviews/{interview_id}/respond", response_model=ResponseOut, status_code=201)
def submit_response(
    interview_id: int,
    response_data: ResponseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit an answer — AI scores it immediately using NLP.
    The score and feedback are saved and returned right away.
    """
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")

    if interview.status == InterviewStatus.completed:
        raise HTTPException(status_code=400, detail="This interview is already completed.")

    question = db.query(Question).filter(Question.id == response_data.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found.")

    if interview.status == InterviewStatus.pending:
        interview.status = InterviewStatus.in_progress
        interview.started_at = datetime.utcnow()

    # ── AI SCORING HAPPENS HERE ──────────────────────────────────────────
    # Call the AI evaluation service to score the answer
    score, feedback = score_response(
        response_text=response_data.response_text,
        ideal_answer=question.ideal_answer or "",
        keywords=question.keywords
    )

    new_response = InterviewResponse(
        interview_id=interview_id,
        question_id=response_data.question_id,
        response_text=response_data.response_text,
        score=score,        # AI score saved!
        feedback=feedback,  # AI feedback saved!
    )
    db.add(new_response)
    db.commit()
    db.refresh(new_response)
    return new_response


@router.post("/interviews/{interview_id}/complete", response_model=SummaryOut)
def complete_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark interview as complete and generate the AI summary report.
    Call this after all questions have been answered.
    """
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")

    if interview.status == InterviewStatus.completed:
        raise HTTPException(status_code=400, detail="Interview already completed.")

    responses = db.query(InterviewResponse).filter(
        InterviewResponse.interview_id == interview_id
    ).all()

    if not responses:
        raise HTTPException(status_code=400, detail="Cannot complete interview with no answers.")

    # Calculate overall score
    scored = [r for r in responses if r.score is not None]
    avg_score = round(sum(r.score for r in scored) / len(scored), 2) if scored else 0

    # Generate AI summary using all responses
    summary_text = generate_summary_feedback(responses)

    # Save summary
    summary = InterviewSummary(
        interview_id=interview_id,
        communication_score=avg_score,
        technical_score=avg_score,
        confidence_score=avg_score,
        strengths=summary_text["strengths"],
        weaknesses=summary_text["weaknesses"],
        recommendations=summary_text["recommendations"]
    )
    db.add(summary)

    # Mark interview done
    interview.status = InterviewStatus.completed
    interview.completed_at = datetime.utcnow()
    interview.overall_score = avg_score

    db.commit()
    db.refresh(summary)
    return summary


@router.get("/interviews/{interview_id}/summary", response_model=SummaryOut)
def get_summary(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")

    if interview.status != InterviewStatus.completed:
        raise HTTPException(status_code=400, detail="Interview is not yet completed.")

    summary = db.query(InterviewSummary).filter(
        InterviewSummary.interview_id == interview_id
    ).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found.")
    return summary


def _auto_report_texts(questions, overall: float):
    """Lightweight strengths/weaknesses when the client does not send them."""
    if not questions:
        return (
            f"Completed AI video interview. Overall score: {overall}%.",
            "Add more practice sessions for richer feedback.",
            "Review the overall score and consider a follow-up technical screen if relevant.",
        )
    highs = [q for q in questions if (q.score or 0) >= 65]
    lows = [q for q in questions if (q.score or 0) < 50]
    parts_s = [f"Overall performance: {overall}% across {len(questions)} questions."]
    if highs:
        parts_s.append(f"Stronger answers on {len(highs)} question(s) (scores ≥65%).")
    strengths = " ".join(parts_s)
    if lows:
        weaknesses = (
            f"{len(lows)} answer(s) scored below 50% — encourage more specific examples and metrics."
        )
    else:
        weaknesses = "No major weak spots flagged by scores; still verify depth in live interview."
    recs = "Use per-question feedback below for targeted coaching before the next round."
    return strengths, weaknesses, recs


def _persist_video_interview_summary(db: Session, interview_id: int, payload: VideoInterviewComplete) -> None:
    """Writes InterviewSummary + report_json. Caller commits; failures must not block interview completion."""
    qs = payload.questions or []
    violations = payload.proctoring_violations or []
    overall = float(payload.overall_score) if payload.overall_score is not None else 0.0
    bm = payload.behavior_metrics if isinstance(payload.behavior_metrics, dict) else None

    def _scores_from_payload():
        if bm and bm.get("communication_score") is not None:
            try:
                comm = float(bm["communication_score"])
                conf = float(bm.get("confidence_score", comm))
                tech = float(bm.get("technical_score", overall))
                return (
                    max(0.0, min(100.0, tech)),
                    max(0.0, min(100.0, comm)),
                    max(0.0, min(100.0, conf)),
                )
            except (TypeError, ValueError):
                pass
        return overall, overall, overall

    tech_s, comm_s, conf_s = _scores_from_payload()

    if qs or payload.strengths or payload.weaknesses or payload.recommendations or violations or bm:
        strengths = payload.strengths
        weaknesses = payload.weaknesses
        recommendations = payload.recommendations
        if strengths is None or weaknesses is None or recommendations is None:
            auto_s, auto_w, auto_r = _auto_report_texts(qs, overall)
            strengths = strengths or auto_s
            weaknesses = weaknesses or auto_w
            recommendations = recommendations or auto_r

        report_obj = {
            "version": 2,
            "overall_score": overall,
            "questions": [q.model_dump() for q in qs],
            "proctoring_violations": violations,
        }
        if bm:
            report_obj["behavior_metrics"] = bm
        report_str = json.dumps(report_obj, ensure_ascii=False)

        summary = db.query(InterviewSummary).filter(
            InterviewSummary.interview_id == interview_id
        ).first()
        if summary:
            summary.technical_score = tech_s
            summary.communication_score = comm_s
            summary.confidence_score = conf_s
            summary.strengths = strengths
            summary.weaknesses = weaknesses
            summary.recommendations = recommendations
            summary.report_json = report_str
        else:
            db.add(InterviewSummary(
                interview_id=interview_id,
                technical_score=tech_s,
                communication_score=comm_s,
                confidence_score=conf_s,
                strengths=strengths,
                weaknesses=weaknesses,
                recommendations=recommendations,
                report_json=report_str,
            ))
    elif payload.overall_score is not None:
        summary = db.query(InterviewSummary).filter(
            InterviewSummary.interview_id == interview_id
        ).first()
        blurb = f"Interview completed. Overall AI score: {overall}%."
        if summary:
            summary.technical_score = tech_s
            summary.communication_score = comm_s
            summary.confidence_score = conf_s
            summary.strengths = summary.strengths or blurb
            summary.weaknesses = summary.weaknesses or "No per-question data was stored for this session."
            summary.recommendations = summary.recommendations or (
                "Schedule a follow-up or ask the candidate to retake with the latest app version for a full report."
            )
            if bm:
                try:
                    summary.report_json = json.dumps(
                        {"version": 2, "overall_score": overall, "behavior_metrics": bm},
                        ensure_ascii=False,
                    )
                except (TypeError, ValueError):
                    pass
        else:
            rj = None
            if bm:
                try:
                    rj = json.dumps(
                        {"version": 2, "overall_score": overall, "behavior_metrics": bm},
                        ensure_ascii=False,
                    )
                except (TypeError, ValueError):
                    rj = None
            db.add(InterviewSummary(
                interview_id=interview_id,
                technical_score=tech_s,
                communication_score=comm_s,
                confidence_score=conf_s,
                strengths=blurb,
                weaknesses="No per-question data was stored for this session.",
                recommendations=(
                    "Ask the candidate to complete the interview using the current build to capture full Q&A."
                ),
                report_json=rj,
            ))


@router.post("/interviews/{interview_id}/video-complete", response_model=InterviewOut)
def complete_video_interview(
    interview_id: int,
    payload: VideoInterviewComplete,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Video interview completion: status/score first (always persisted), then optional
    recruiter summary in a second step so DB errors on report_json do not leave the
    interview stuck in_progress.
    """
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")

    raw_status = payload.status
    if isinstance(raw_status, str):
        try:
            interview.status = InterviewStatus(raw_status)
        except ValueError:
            interview.status = InterviewStatus.pending
    else:
        interview.status = raw_status

    eff_completed = interview.status == InterviewStatus.completed
    if eff_completed:
        interview.completed_at = datetime.utcnow()
    if payload.overall_score is not None:
        interview.overall_score = round(float(payload.overall_score), 2)
    if interview.started_at is None:
        interview.started_at = datetime.utcnow()

    # Commit interview row first so status/score are never lost if summary insert fails
    db.commit()
    db.refresh(interview)

    if eff_completed:
        try:
            _persist_video_interview_summary(db, interview_id, payload)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.warning(
                "Interview %s marked completed but summary save failed (add report_json column if needed): %s",
                interview_id,
                e,
            )

    db.refresh(interview)
    return interview
