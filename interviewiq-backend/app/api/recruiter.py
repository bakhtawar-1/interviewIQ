"""
api/recruiter.py - Recruiter Endpoints
========================================
Recruiters (HR people) can view candidate interviews and results.
They CANNOT create interviews or modify data — read-only access.

Endpoints:
  GET /api/recruiter/candidates           → List all candidates
  GET /api/recruiter/candidates/{id}/interviews → View a candidate's interviews
  GET /api/recruiter/interviews/{id}/summary   → View an interview's report
  GET /api/recruiter/interviews/{id}/report-document → Download full report (.txt)
"""

import json
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from starlette.responses import Response
from sqlalchemy.orm import Session
from typing import List, Tuple
from app.database import get_db
from app.models.user import User, UserRole
from app.models.interview import Interview, InterviewStatus
from app.models.response import InterviewSummary, InterviewResponse
from app.models.question import Question
from app.schemas.user import RecruiterCandidateOut
from app.schemas.interview import InterviewOut, SummaryOut, RecruiterAnswerOut
from app.utils.helpers import get_current_user, require_role

router = APIRouter(
    prefix="/api/recruiter",
    tags=["Recruiter"],
    # Only recruiters and admins can access these endpoints
    dependencies=[Depends(require_role([UserRole.recruiter, UserRole.admin]))]
)


def _interview_is_completed(inv: Interview) -> bool:
    """DB may return Enum or raw string depending on driver/version."""
    s = inv.status
    if isinstance(s, InterviewStatus):
        return s == InterviewStatus.completed
    v = getattr(s, "value", s)
    return str(v).lower() == "completed"


def _build_report_document(db: Session, interview_id: int) -> Tuple[str, str]:
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")
    candidate = db.query(User).filter(User.id == interview.user_id).first()
    summary = db.query(InterviewSummary).filter(
        InterviewSummary.interview_id == interview_id
    ).first()

    lines: List[str] = []
    lines.append("INTERVIEWIQ — CANDIDATE INTERVIEW REPORT")
    lines.append("=" * 56)
    lines.append("")
    lines.append(f"Candidate: {candidate.full_name if candidate else 'Unknown'}")
    lines.append(f"Email:     {candidate.email if candidate else '—'}")
    lines.append(f"Interview ID: {interview_id}")
    lines.append(f"Job / role:   {interview.job_title or '—'}")
    it = getattr(interview.interview_type, "value", interview.interview_type)
    diff = getattr(interview.difficulty, "value", interview.difficulty)
    st = getattr(interview.status, "value", interview.status)
    lines.append(f"Type: {it}  |  Difficulty: {diff}  |  Status: {st}")
    if st == "disqualified":
        lines.append("")
        lines.append("!!! DISQUALIFIED !!!")
        lines.append("Reason: High proctoring violation count detected during session.")
    if interview.overall_score is not None:
        lines.append(f"Overall score: {round(float(interview.overall_score))}%")
    lines.append("")
    lines.append("-" * 56)
    lines.append("EXECUTIVE SUMMARY")
    lines.append("-" * 56)
    if summary:
        if summary.strengths:
            lines.append("Strengths:")
            lines.append(summary.strengths)
            lines.append("")
        if summary.weaknesses:
            lines.append("Areas to improve:")
            lines.append(summary.weaknesses)
            lines.append("")
        if summary.recommendations:
            lines.append("Recommendations:")
            lines.append(summary.recommendations)
            lines.append("")
        for label, val in (
            ("Communication (avg)", summary.communication_score),
            ("Technical (avg)", summary.technical_score),
            ("Confidence (avg)", summary.confidence_score),
        ):
            if val is not None:
                lines.append(f"{label}: {round(float(val))}%")
        if summary.communication_score is not None:
            lines.append("")
    else:
        lines.append("No summary record on file.")
        lines.append("")

    lines.append("-" * 56)
    lines.append("QUESTION-BY-QUESTION")
    lines.append("-" * 56)

    db_rows = (
        db.query(InterviewResponse, Question.question_text)
        .join(Question, Question.id == InterviewResponse.question_id)
        .filter(InterviewResponse.interview_id == interview_id)
        .order_by(InterviewResponse.responded_at.asc())
        .all()
    )
    if db_rows:
        for i, (resp, qtext) in enumerate(db_rows, start=1):
            lines.append(f"\nQ{i}: {qtext or '—'}")
            lines.append(f"Answer: {resp.response_text}")
            if resp.score is not None:
                lines.append(f"Score: {round(float(resp.score))}%")
            if resp.feedback:
                lines.append(f"Feedback: {resp.feedback}")
    elif summary and summary.report_json:
        try:
            data = json.loads(summary.report_json)
            viol = data.get("proctoring_violations") or []
            if viol:
                lines.append("\nProctoring log:")
                for v in viol:
                    lines.append(f"  • {v}")
                lines.append("")
            bm = data.get("behavior_metrics")
            if isinstance(bm, dict) and bm.get("signals"):
                sig = bm.get("signals") or {}
                lines.append("\nNonverbal / delivery signals (heuristic, not clinical):")
                lines.append(
                    f"  • Face samples: {sig.get('face_sample_count', '—')} | "
                    f"Mic segments: {sig.get('voice_segment_count', '—')}"
                )
                lines.append(
                    f"  • Attention index: {sig.get('attention_index', '—')} | "
                    f"Expressiveness: {sig.get('expressiveness_index', '—')} | "
                    f"Voice steadiness: {sig.get('voice_steadiness_index', '—')}"
                )
                lines.append(
                    f"  • Violations counted: eyes-off {sig.get('violation_eyes_off', 0)}, "
                    f"no-face {sig.get('violation_no_face', 0)}, tab {sig.get('violation_tab', 0)}, "
                    f"phone {sig.get('violation_phone', 0)}"
                )
                if sig.get("notes"):
                    lines.append(f"  • Note: {sig.get('notes')}")
                lines.append("")
            for i, item in enumerate(data.get("questions") or [], start=1):
                lines.append(f"\nQ{i}: {item.get('question', '—')}")
                lines.append(f"Answer: {item.get('answer', '—')}")
                sc = item.get("score")
                if sc is not None:
                    lines.append(f"Score: {round(float(sc))}%")
                fb = item.get("feedback")
                if fb:
                    lines.append(f"Feedback: {fb}")
                if item.get("followup_question"):
                    lines.append(f"Follow-up Q: {item.get('followup_question')}")
                    lines.append(f"Follow-up A: {item.get('followup_answer', '—')}")
                    fsc = item.get("followup_score")
                    if fsc is not None:
                        lines.append(f"Follow-up score: {round(float(fsc))}%")
                    ffb = item.get("followup_feedback")
                    if ffb:
                        lines.append(f"Follow-up feedback: {ffb}")
        except (json.JSONDecodeError, TypeError, ValueError):
            lines.append("(Could not parse stored session detail.)")
    else:
        lines.append("No per-question data stored for this interview.")

    lines.append("")
    lines.append("=" * 56)
    lines.append("End of report — InterviewIQ")
    text = "\n".join(lines)
    fname = f"interview-{interview_id}-report.txt"
    return text, fname


@router.get("/candidates", response_model=List[RecruiterCandidateOut])
def list_candidates(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)  # _ means we need auth but won't use the user object
):
    """
    Get all registered candidates with interview counts and average completed score.
    """
    candidates = (
        db.query(User)
        .filter(User.role == UserRole.candidate)
        .order_by(User.created_at.desc())
        .all()
    )
    ids = [c.id for c in candidates]
    stats = {i: {"total": 0, "completed": 0, "scores": []} for i in ids}
    job_by_user = defaultdict(set)
    if ids:
        for inv in db.query(Interview).filter(Interview.user_id.in_(ids)).all():
            st = stats[inv.user_id]
            st["total"] += 1
            if _interview_is_completed(inv):
                st["completed"] += 1
                if inv.overall_score is not None:
                    st["scores"].append(float(inv.overall_score))
            jt = (inv.job_title or "").strip()
            if jt:
                job_by_user[inv.user_id].add(jt)

    out: List[RecruiterCandidateOut] = []
    for c in candidates:
        st = stats[c.id]
        avg = round(sum(st["scores"]) / len(st["scores"]), 1) if st["scores"] else None
        out.append(
            RecruiterCandidateOut(
                id=c.id,
                email=c.email,
                full_name=c.full_name,
                role=c.role,
                is_active=c.is_active,
                approval_status=c.approval_status,
                skills=c.skills,
                education=c.education,
                experience=c.experience,
                created_at=c.created_at,
                interview_count=st["total"],
                completed_interview_count=st["completed"],
                average_score=avg,
                job_roles=sorted(job_by_user[c.id]),
            )
        )
    return out


@router.get("/candidates/{candidate_id}/interviews", response_model=List[InterviewOut])
def get_candidate_interviews(
    candidate_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Get all interviews for a specific candidate."""
    # First verify the candidate exists
    candidate = db.query(User).filter(
        User.id == candidate_id,
        User.role == UserRole.candidate
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    interviews = db.query(Interview)\
        .filter(Interview.user_id == candidate_id)\
        .order_by(Interview.created_at.desc())\
        .all()
    return interviews


@router.get("/interviews/{interview_id}/summary", response_model=SummaryOut)
def get_interview_summary(
    interview_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """View the summary/report of any completed interview."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")
    summary = db.query(InterviewSummary).filter(
        InterviewSummary.interview_id == interview_id
    ).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found.")
    
    # Dynamic override for disqualified sessions (handles existing 'N/A' data)
    if interview.status.value == 'disqualified' if hasattr(interview.status, 'value') else interview.status == 'disqualified':
        summary.strengths = "N/A - Candidate disqualified due to proctoring violations."
        summary.weaknesses = "High violation count detected. Candidate exceeded the maximum allowed proctoring violations."
        summary.recommendations = "Rejected due to security/proctoring violations. Not recommended for further rounds."
        
    return summary


@router.get("/interviews/{interview_id}/responses", response_model=List[RecruiterAnswerOut])
def get_interview_responses_recruiter(
    interview_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """
    Per-question scores and feedback (e.g. video AI interviews may not have a summary row).
    """
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")

    rows = (
        db.query(InterviewResponse, Question.question_text)
        .join(Question, Question.id == InterviewResponse.question_id)
        .filter(InterviewResponse.interview_id == interview_id)
        .order_by(InterviewResponse.responded_at.asc())
        .all()
    )
    out: List[RecruiterAnswerOut] = []
    for resp, qtext in rows:
        out.append(RecruiterAnswerOut(
            id=resp.id,
            interview_id=resp.interview_id,
            question_id=resp.question_id,
            question_text=qtext,
            response_text=resp.response_text,
            score=resp.score,
            feedback=resp.feedback,
            responded_at=resp.responded_at,
        ))
    return out


@router.get("/interviews/{interview_id}", response_model=InterviewOut)
def get_interview_for_recruiter(
    interview_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Interview metadata for any candidate (read-only)."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")
    return interview


@router.get("/interviews/{interview_id}/report-document")
def download_interview_report_document(
    interview_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Plain-text download: full summary + Q&A + proctoring (for recruiters)."""
    text, filename = _build_report_document(db, interview_id)
    return Response(
        content=text.encode("utf-8"),
        media_type="text/plain; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )
