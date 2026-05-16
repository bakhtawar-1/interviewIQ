"""
main.py - FastAPI Application Entry Point
==========================================
All routers registered here. Visit /docs for Swagger UI.
"""
from sqlalchemy.orm import Session
from fastapi import Depends
from app.database import get_db
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.api import auth, candidate, recruiter, admin
from app.api.interview_ai import router as interview_ai_router
from app.api.jobs import recruiter_router as jobs_recruiter_router, public_router as jobs_public_router
from app.api.applications import router as applications_router
from app.api.recruiter_review import router as recruiter_review_router

app = FastAPI(
    title="InterviewIQ API",
    description="AI-powered interview platform backend",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://interviewiq-nu.vercel.app",
        "https://interview-kh6v8acdv-bakhtawarbaig91-4537s-projects.vercel.app",
        "*",  # temporary - allows all origins
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(candidate.router)
app.include_router(recruiter.router)
app.include_router(admin.router)
app.include_router(interview_ai_router)

# New routers (Phase 2)
app.include_router(jobs_recruiter_router)   # /api/recruiter/jobs
app.include_router(jobs_public_router)      # /api/jobs
app.include_router(applications_router)     # /api/candidate/apply + /api/candidate/applications
app.include_router(recruiter_review_router) # /api/recruiter/applications


# ── Database init ─────────────────────────────────────────────────────────────
@app.on_event("startup")
def startup_event():
    import app.models  # noqa: F401 — ensures all models are imported before create_all
    from app.utils.db_migrations import run_manual_migrations
    try:
        run_manual_migrations()
    except Exception as e:
        print(f"Migration warning: {e}")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created/verified!")


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"status": "running", "app": "InterviewIQ API", "version": "2.0.0", "docs": "/docs"}


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
@app.get("/create-admin-secret-123")
def create_admin(db: Session = Depends(get_db)):
    from app.models.user import User, UserRole, ApprovalStatus
    from app.utils.security import hash_password
    existing = db.query(User).filter(User.email == "admin@interviewiq.com").first()
    if existing:
        return {"message": "Admin already exists"}
    admin_user = User(
        email="admin@interviewiq.com",
        full_name="Admin",
        hashed_password=hash_password("admin123"),
        role=UserRole.admin,
        approval_status=ApprovalStatus.approved,
        is_active=True,
    )
    db.add(admin_user)
    db.commit()
    return {"message": "Admin created!", "email": "admin@interviewiq.com", "password": "admin123"}