"""
api/candidate.py - Candidate Endpoints
Profile management, CV upload, and interview sessions.
"""

import json
import logging
import os
import sys
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.interview import Interview, InterviewStatus
from app.models.question import Question
from app.models.response import InterviewResponse, InterviewSummary
from app.models.application import Application, ApplicationStatus

from app.schemas.interview import (
    InterviewCreate, InterviewOut, ResponseCreate, ResponseOut, SummaryOut, VideoInterviewComplete
)
from app.schemas.user import UserOut, UserUpdate
from app.utils.helpers import get_current_user, require_role
from app.services.evaluation_service import score_response, generate_summary_feedback

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/candidate",
    tags=["Candidate"],
    dependencies=[Depends(require_role([UserRole.candidate, UserRole.admin]))]
)


# ── Profile Endpoints ─────────────────────────────────────────────────────────

@router.get("/profile", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    """Get the logged-in candidate's full profile."""
    return current_user


@router.patch("/profile", response_model=UserOut)
def update_profile(
    update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update candidate profile (name, skills, education, experience)."""
    for field, value in update.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/upload-cv")
async def upload_cv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a CV (PDF/DOCX/TXT).
    Parses the CV and auto-populates the candidate profile fields.
    """
    ML_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'ml')
    if ML_DIR not in sys.path:
        sys.path.insert(0, ML_DIR)

    allowed = {'.pdf', '.docx', '.txt', '.doc'}
    ext = os.path.splitext(file.filename or '')[1].lower()
    if ext not in allowed:
        raise HTTPException(400, f"File type '{ext}' not supported. Upload PDF, DOCX, or TXT.")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(400, "File too large. Maximum 5MB.")

    try:
        from cv_parser import parse_cv
        cv_data = parse_cv(contents, file.filename)
    except Exception as e:
        raise HTTPException(500, f"Failed to parse CV: {e}")

    if not cv_data.get('is_valid', True):
        raise HTTPException(422, cv_data.get('error', 'Invalid document'))

    skills_list = cv_data.get('skills', [])
    if skills_list:
        current_user.skills = ", ".join(skills_list)

    edu_list = cv_data.get('education', [])
    if edu_list:
        current_user.education = (
            "; ".join(edu_list) if isinstance(edu_list, list) else str(edu_list)
        )

    exp_years = cv_data.get('experience_years', 0)
    job_titles = cv_data.get('job_titles', [])
    if exp_years or job_titles:
        parts = []
        if exp_years:
            parts.append(f"{exp_years} years experience")
        if job_titles:
            parts.append(", ".join(job_titles[:3]))
        current_user.experience = "; ".join(parts)

    current_user.cv_text = cv_data.get('cv_summary', '') or cv_data.get('raw_text', '')

    # ── RE-EVALUATE EXISTING APPLICATIONS ──────────────────────────────────
    # If they have failed CV matches, re-calculate them with the new data
    from app.services.cv_matching_service import match_cv_to_job
    from app.models.job import Job
    from app.models.application import Application, ApplicationStatus

    apps_to_update = db.query(Application).filter(
        Application.candidate_id == current_user.id,
        Application.status.in_([ApplicationStatus.cv_failed, ApplicationStatus.pending_review])
    ).all()

    for app in apps_to_update:
        job = db.query(Job).filter(Job.id == app.job_id).first()
        if not job: continue
        
        res = match_cv_to_job(
            cv_text=current_user.cv_text,
            job_description=job.description,
            required_skills=job.required_skills,
            required_experience=job.required_experience,
            required_education=job.required_education
        )
        
        app.cv_match_score = res["total_score"]
        
        # If they now pass the threshold, move them back to interview_pending
        if (res["total_score"] >= job.cv_match_threshold and 
            res.get("experience_passed", True) and 
            res.get("education_passed", True)):
            app.status = ApplicationStatus.interview_pending
        elif app.status == ApplicationStatus.pending_review:
            # If they were pending but now fail, mark as failed
            if res["total_score"] < job.cv_match_threshold:
                app.status = ApplicationStatus.cv_failed

    db.commit()
    db.refresh(current_user)

    return {
        "message": "CV uploaded and profile updated successfully.",
        "parsed": {
            "name": cv_data.get('name', ''),
            "email": cv_data.get('email', ''),
            "skills": skills_list,
            "experience_years": exp_years,
            "job_titles": job_titles,
            "education": edu_list,
        }
    }


@router.post("/remove-cv")
def delete_cv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete the candidate's CV data and reset profile fields."""
    current_user.cv_text = None
    current_user.skills = None
    current_user.experience = None
    current_user.education = None
    db.commit()
    return {"message": "CV deleted successfully. Profile reset."}


@router.post("/interviews", response_model=InterviewOut, status_code=201)
def start_interview(
    interview_data: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Resolve application_id: frontend may send job_id instead of application_id
    resolved_app_id = None
    if interview_data.application_id:
        # First try: direct application lookup
        app = db.query(Application).filter(
            Application.id == interview_data.application_id,
            Application.candidate_id == current_user.id
        ).first()

        if not app:
            # Second try: treat it as a job_id and find the user's application for that job
            app = db.query(Application).filter(
                Application.job_id == interview_data.application_id,
                Application.candidate_id == current_user.id
            ).first()

        if app:
            resolved_app_id = app.id
            if app.status == ApplicationStatus.interview_completed:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You have already taken the interview for this job. Only one attempt is allowed."
                )

    new_interview = Interview(
        user_id=current_user.id,
        application_id=resolved_app_id,
        is_mock=interview_data.is_mock,
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

    # Dynamic override for disqualified sessions
    if interview.status.value == 'disqualified' if hasattr(interview.status, 'value') else interview.status == 'disqualified':
        summary.strengths = "N/A - Candidate disqualified due to proctoring violations."
        summary.weaknesses = "High violation count detected. Candidate exceeded the maximum allowed proctoring violations."
        summary.recommendations = "Rejected due to security/proctoring violations. Not recommended for further rounds."

    return summary


def _auto_report_texts(questions, overall: float):
    """Generates specific strengths and weaknesses based on question scores and text."""
    if not questions:
        return (
            f"Completed AI video interview. Overall score: {overall}%.",
            "Add more practice sessions for richer feedback.",
            "Review the overall score and consider a follow-up technical screen if relevant.",
        )

    strengths_list = []
    weaknesses_list = []

    for q in questions:
        score = q.score or 0
        # Extract a short snippet of the question to represent the topic
        topic = " ".join(q.question.split()[:6]).replace("?", "").replace(":", "") + "..."
        
        if score >= 70:
            strengths_list.append(topic)
        elif score < 50:
            weaknesses_list.append(topic)

    # Build Strengths string
    if strengths_list:
        if len(strengths_list) == 1:
            strengths = f"Strong knowledge demonstrated in: '{strengths_list[0]}'"
        else:
            strengths = "Strong knowledge demonstrated in topics like: " + ", ".join([f"'{t}'" for t in strengths_list[:3]])
    else:
        if overall >= 60:
            strengths = f"Overall solid performance with a score of {overall}%."
        else:
            strengths = "Demonstrated basic familiarity with the core concepts."

    # Build Weaknesses string
    if weaknesses_list:
        if len(weaknesses_list) == 1:
            weaknesses = f"Struggled with or lacked detail in: '{weaknesses_list[0]}'. Review this area."
        else:
            weaknesses = "Need improvement or more detail in topics like: " + ", ".join([f"'{t}'" for t in weaknesses_list[:3]])
    else:
        if overall < 70:
            weaknesses = "Answers were generally adequate but lacked deep technical specificity or clear examples."
        else:
            weaknesses = "No major weak spots flagged by scores. Continue expanding your technical depth."

    recs = "Use the detailed per-question feedback below for targeted coaching before your next interview round."
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
        
        # Override if disqualified
        if payload.status == "disqualified":
            strengths = "N/A - Candidate disqualified due to proctoring violations."
            weaknesses = "High violation count detected. Candidate exceeded the maximum allowed proctoring violations (tab switching, face hidden, etc.)."
            recommendations = "Rejected due to security/proctoring violations. Not recommended for further rounds."
        elif strengths is None or weaknesses is None or recommendations is None:
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

    # STRICT ONE-TIME POLICY: Lock application immediately if session started, finished, or disqualified
    if interview.application_id:
        app_obj = db.query(Application).filter(Application.id == interview.application_id).first()
        if app_obj:
            if interview.status == InterviewStatus.disqualified:
                app_obj.status = ApplicationStatus.rejected
                app_obj.rejection_reason = "Disqualified due to repeated proctoring violations (tab switching, face hidden, etc.)."
            elif app_obj.status == ApplicationStatus.interview_pending:
                app_obj.status = ApplicationStatus.interview_completed
            db.commit()

    if eff_completed or interview.status == InterviewStatus.disqualified:
        try:
            _persist_video_interview_summary(db, interview_id, payload)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.warning(
                "Interview %s ended with status %s but summary save failed: %s",
                interview_id,
                interview.status,
                e,
            )

    db.refresh(interview)
    return interview
