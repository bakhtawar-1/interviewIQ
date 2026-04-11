# InterviewIQ Backend

AI-powered mock interview platform — FastAPI + PostgreSQL backend.

---

## 📁 Project Structure

```
interviewiq-backend/
├── app/
│   ├── main.py          → App entry point, registers all routes
│   ├── config.py        → Reads settings from .env
│   ├── database.py      → PostgreSQL connection + session management
│   │
│   ├── models/          → Database tables (SQLAlchemy ORM)
│   │   ├── user.py      → users table
│   │   ├── interview.py → interviews table
│   │   ├── question.py  → questions table (question bank)
│   │   └── response.py  → interview_responses + interview_summaries tables
│   │
│   ├── schemas/         → API request/response shapes (Pydantic)
│   │   ├── user.py      → UserCreate, UserLogin, UserOut, Token
│   │   └── interview.py → InterviewCreate, ResponseCreate, etc.
│   │
│   ├── api/             → HTTP endpoints (thin layer, no business logic)
│   │   ├── auth.py      → POST /api/auth/register, /login
│   │   ├── candidate.py → Interview management for candidates
│   │   ├── recruiter.py → Read-only access for recruiters
│   │   └── admin.py     → Full control for admins
│   │
│   ├── services/        → Business logic
│   │   ├── interview_service.py  → Complete interview, pick questions
│   │   └── evaluation_service.py → Score responses (Phase 2: AI scoring)
│   │
│   └── utils/
│       ├── security.py  → Password hashing (bcrypt), JWT tokens
│       └── helpers.py   → get_current_user, require_role dependencies
│
├── tests/               → Unit tests (to be added)
├── requirements.txt     → Python dependencies
├── .env                 → Environment variables (NEVER commit this!)
└── .gitignore
```

---

## 🚀 Setup Instructions (Run Once)

### Step 1: Install PostgreSQL
- **Windows**: Download from https://www.postgresql.org/download/
- **Mac**: `brew install postgresql`

After installing, create the database:
```sql
psql -U postgres
CREATE DATABASE interviewiq;
\q
```

### Step 2: Set Up Python Virtual Environment
```bash
# Navigate to backend folder
cd interviewiq-backend

# Create virtual environment
python -m venv venv

# Activate it:
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# You should see (venv) in your terminal prompt
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables
Copy `.env` and update the values:
```bash
# Edit .env file:
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/interviewiq
SECRET_KEY=make-this-a-long-random-string-change-this
```

### Step 5: Run the Server
```bash
uvicorn app.main:app --reload
```

The `--reload` flag restarts the server automatically when you change code.

---

## 📚 API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs  ← Interactive API testing!
- **ReDoc**: http://localhost:8000/redoc

---

## 🔗 Key Endpoints

| Method | URL | Description | Auth Required |
|--------|-----|-------------|---------------|
| POST | /api/auth/register | Create account | No |
| POST | /api/auth/login | Login, get token | No |
| POST | /api/candidate/interviews | Start interview | Candidate |
| GET | /api/candidate/interviews | My interviews | Candidate |
| POST | /api/candidate/interviews/{id}/respond | Submit answer | Candidate |
| GET | /api/recruiter/candidates | List candidates | Recruiter |
| GET | /api/admin/stats | System stats | Admin |
| POST | /api/admin/questions | Add question | Admin |

---

## 🔐 How Authentication Works

1. **Register**: POST to `/api/auth/register` with your details
2. **Login**: POST to `/api/auth/login` → get a JWT token
3. **Use token**: Add to every request header:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   ```

---

## 👥 User Roles

| Role | Can Do |
|------|--------|
| **candidate** | Take interviews, view their own results |
| **recruiter** | View all candidates and their interview reports |
| **admin** | Everything + manage questions and users |

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `users` | All user accounts |
| `interviews` | Interview sessions |
| `questions` | Question bank |
| `interview_responses` | Individual answers |
| `interview_summaries` | Final reports |

---

## 🔮 Phase 2 (Coming Next)

- [ ] Add NLP scoring in `evaluation_service.py`
- [ ] Integrate speech-to-text for voice interviews
- [ ] Alembic database migrations
- [ ] Unit tests in `tests/`
- [ ] Docker deployment setup
