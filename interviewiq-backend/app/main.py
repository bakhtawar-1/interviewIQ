"""
main.py - FastAPI Application Entry Point
==========================================
This is where everything comes together.
FastAPI reads this file when you start the server.

WHAT HAPPENS WHEN YOU RUN:
  uvicorn app.main:app --reload

1. FastAPI creates the "app" object
2. All routers (auth, candidate, recruiter, admin) are registered
3. The server starts listening on http://localhost:8000
4. Visit http://localhost:8000/docs for the auto-generated API docs!

startup_event():
  Creates all database tables on startup (if they don't exist already).
  This is safe to run multiple times — SQLAlchemy won't recreate existing tables.
"""
from app.api.interview_ai import router as interview_ai_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.api import auth, candidate, recruiter, admin

# ─── Create FastAPI App ────────────────────────────────────────────────────

app = FastAPI(
    title="InterviewIQ API",
    description="AI-powered mock interview platform backend",
    version="1.0.0",
    docs_url="/docs",       # Swagger UI at http://localhost:8000/docs
    redoc_url="/redoc",     # ReDoc UI at http://localhost:8000/redoc
)

# ─── CORS Middleware ───────────────────────────────────────────────────────
# CORS = Cross-Origin Resource Sharing
# Your React frontend (running on localhost:3000) needs permission
# to talk to your backend (running on localhost:8000)
# Without this, the browser will BLOCK all requests!

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # React dev server
        "http://localhost:5173",   # Vite dev server (alternative)
    ],
    allow_credentials=True,
    allow_methods=["*"],           # Allow all HTTP methods (GET, POST, DELETE, etc.)
    allow_headers=["*"],           # Allow all headers (including Authorization)
)

# ─── Register Routers ──────────────────────────────────────────────────────
# Each router is a group of related endpoints defined in the api/ folder
app.include_router(interview_ai_router)
app.include_router(auth.router)       # /api/auth/...
app.include_router(candidate.router)  # /api/candidate/...
app.include_router(recruiter.router)  # /api/recruiter/...
app.include_router(admin.router)      # /api/admin/...

# ─── Database Table Creation ───────────────────────────────────────────────

@app.on_event("startup")
def startup_event():
    """
    Runs ONCE when the server starts.
    Creates all tables defined in models/ if they don't exist yet.
    
    In production, you'd use Alembic migrations instead of this.
    For development/FYP, this is fine!
    """
    # This imports all models so SQLAlchemy knows about all tables
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created/verified!")


# ─── Health Check Endpoint ─────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    """
    Health check endpoint.
    Visit http://localhost:8000/ to verify the server is running.
    """
    return {
        "status": "running",
        "app": "InterviewIQ API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Simple health check for deployment monitoring."""
    return {"status": "healthy"}
