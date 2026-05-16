"""
services/cv_matching_service.py
=================================
Matches a candidate's CV against a job description.
Returns a score 0-100 with a skill/experience/education breakdown.

Uses keyword overlap (no external NLP dependency required).
If spaCy is installed, automatically uses lemmatization for better matching.
"""

import re
from typing import Dict, Optional, List, Set

# Common technical synonyms and aliases to handle typos/variations
TECH_SYNONYMS = {
    "postgresql": ["postgres", "postgresql", "postresql", "psql"],
    "mongodb": ["mongo", "mongodb", "nosql"],
    "javascript": ["js", "javascript", "ecmascript"],
    "typescript": ["ts", "typescript"],
    "react": ["reactjs", "react.js", "react"],
    "next.js": ["nextjs", "next.js"],
    "node.js": ["nodejs", "node.js", "node"],
    "aws": ["amazon web services", "aws"],
    "gcp": ["google cloud", "gcp"],
    "nlp": ["natural language processing", "nlp"],
    "ml": ["machine learning", "ml"],
    "ai": ["artificial intelligence", "ai"],
    "css": ["css3", "css", "tailwind", "bootstrap"],
    "html": ["html5", "html"],
}


# ─── spaCy lazy loader ───────────────────────────────────────────────────────

_nlp = None


def _get_nlp():
    """Try to load spaCy; fall back to None (keyword mode)."""
    global _nlp
    if _nlp is None:
        try:
            import spacy
            _nlp = spacy.load("en_core_web_sm")
        except Exception:
            _nlp = "unavailable"
    return None if _nlp == "unavailable" else _nlp


# ─── Text helpers ─────────────────────────────────────────────────────────────

def _tokenize(text: str):
    """Return a set of lowercase tokens (lemmatized if spaCy available)."""
    text = text.lower().strip()
    nlp = _get_nlp()
    if nlp:
        doc = nlp(text)
        return {t.lemma_ for t in doc if not t.is_stop and not t.is_punct and len(t.text) > 1}
    
    # Fallback: aggressive regex split to handle "React.js", "Node/Express", etc.
    # We split by anything that isn't a letter or number, but we keep the pieces.
    tokens = re.split(r'[^a-z0-9]', text)
    return {t.strip() for t in tokens if len(t) > 1}


def _overlap_score(source_tokens: set, target_tokens: set) -> float:
    """Jaccard-style overlap between two token sets → 0.0 to 1.0."""
    if not target_tokens:
        return 0.5  # no requirement = partially satisfied
    matched = source_tokens & target_tokens
    return len(matched) / len(target_tokens)


# ─── Main matching function ───────────────────────────────────────────────────

def match_cv_to_job(
    cv_text: str,
    job_description: str,
    required_skills: Optional[str] = None,
    required_experience: Optional[str] = None,
    required_education: Optional[str] = None,
) -> Dict:
    """
    Match a candidate's CV text against a job posting.

    Returns:
      {
        "total_score": float (0-100),
        "skills_score": float (0-100),
        "experience_score": float (0-100),
        "education_score": float (0-100),
        "breakdown": dict with details
      }

    Weights:
      Skills:     50%
      Experience: 30%
      Education:  20%
    """
    if not cv_text or not cv_text.strip():
        return _zero_result("No CV text available")

    cv_tokens = _tokenize(cv_text)

    # ── Skills match (50%) ────────────────────────────────────────────────────
    skills_score = 0.0
    matched_skills = []
    missing_skills = []

    if required_skills:
        skill_list = [s.strip().lower() for s in required_skills.split(",") if s.strip()]
        if skill_list:
            for skill in skill_list:
                skill_tokens = _tokenize(skill)
                
                # Check 1: Direct token overlap
                if skill_tokens & cv_tokens:
                    matched_skills.append(skill)
                    continue
                
                # Check 2: Synonym/Alias match
                found_via_synonym = False
                for canonical, aliases in TECH_SYNONYMS.items():
                    # If the required skill is one of the aliases
                    if skill in aliases or any(tok in aliases for tok in skill_tokens):
                        # Check if candidate has ANY of the other aliases
                        if any(alias in cv_text.lower() for alias in aliases):
                            found_via_synonym = True
                            break
                
                if found_via_synonym:
                    matched_skills.append(skill)
                else:
                    missing_skills.append(skill)
            
            skills_score = (len(matched_skills) / len(skill_list)) * 100
    else:
        # No specific skills required → match against job description keywords
        jd_tokens = _tokenize(job_description)
        overlap = _overlap_score(cv_tokens, jd_tokens)
        skills_score = overlap * 100
        matched_skills = []
        missing_skills = []

    # ── Experience match (30%) ─────────────────────────────────────────────────
    experience_score = 0.0
    exp_notes = ""
    exp_passed = True  # Track strict pass/fail separately from score

    if required_experience:
        # Extract years from CV (e.g. "3 years", "5+ years")
        year_matches = re.findall(r"(\d+)\s*(?:\+\s*)?years?", cv_text.lower())
        years_in_cv = max((int(y) for y in year_matches), default=0)

        # Fallback: Estimate years from date ranges if no explicit "X years" mention found
        if years_in_cv == 0:
            date_ranges = re.findall(
                r"\b(19[8-9]\d|20[0-2]\d)\b\s*[-–]\s*(present|\b(19[8-9]\d|20[0-2]\d)\b)",
                cv_text.lower()
            )
            if date_ranges:
                current_year = 2026
                total_span = 0
                for start, end_text, _ in date_ranges:
                    s = int(start)
                    e = current_year if end_text == "present" else int(end_text)
                    if s <= e:
                        total_span += (e - s)
                years_in_cv = max(years_in_cv, total_span)

        # Extract required years from string (e.g. "2-3 years", "5 years")
        req_years_match = re.search(r"(\d+)", required_experience)
        req_years = int(req_years_match.group(1)) if req_years_match else 0

        # STRICT CHECK: If job requires X years, candidate MUST have >= X years
        if req_years > 0:
            if years_in_cv >= req_years:
                experience_score = 100.0
                exp_passed = True
            else:
                # Candidate does NOT meet the experience requirement
                experience_score = round((years_in_cv / req_years) * 100, 1) if req_years > 0 else 0.0
                exp_passed = False  # HARD FAIL — no compromise
        else:
            # If job says "Fresh Graduates" or "0 years", they pass
            experience_score = 100.0
            exp_passed = True

        exp_notes = f"Found ~{years_in_cv} years of experience in CV. Required: {req_years}+ years. Status: {'PASSED' if exp_passed else 'FAILED'}"
    else:
        experience_score = 60.0
        exp_notes = "No specific experience requirement set"

    # ── Education match (20%) ──────────────────────────────────────────────────
    education_score = 0.0
    edu_notes = ""
    edu_passed = True  # Track strict pass/fail separately from score

    edu_keywords = {
        "phd": ["phd", "doctorate", "ph.d"],
        "masters": ["master", "msc", "m.sc", "ms ", "mba", "graduate"],
        "bachelors": ["bachelor", "bsc", "b.sc", "bs ", "undergraduate", "degree"],
        "diploma": ["diploma", "associate", "certificate"],
    }

    # Common subject/major keywords to match
    subject_keywords = [
        "computer science", "cs", "software engineering", "information technology", "it",
        "engineering", "electrical", "mechanical", "civil",
        "arts", "fine arts", "liberal arts",
        "business", "commerce", "accounting", "finance", "economics",
        "design", "graphic design",
        "mathematics", "math", "statistics",
        "physics", "chemistry", "biology", "science",
        "psychology", "sociology", "law", "medicine",
    ]

    if required_education:
        req_edu_lower = required_education.lower()
        cv_lower = cv_text.lower()

        # Find required degree level
        req_level = None
        for level, kws in edu_keywords.items():
            if any(k in req_edu_lower for k in kws):
                req_level = level
                break

        # Find candidate's degree level in CV
        cv_level = None
        for level, kws in edu_keywords.items():
            if any(k in cv_lower for k in kws):
                cv_level = level
                break

        level_order = ["diploma", "bachelors", "masters", "phd"]

        # --- STRICT DEGREE LEVEL CHECK ---
        level_ok = False
        if req_level and cv_level:
            ri = level_order.index(req_level) if req_level in level_order else 0
            ci = level_order.index(cv_level) if cv_level in level_order else 0
            level_ok = ci >= ri  # Candidate's level must be >= required level
        elif not req_level:
            level_ok = True  # No specific level required
        # If req_level exists but cv_level is None → level_ok stays False

        # --- STRICT SUBJECT/MAJOR CHECK ---
        # Map common abbreviations to full terms for better matching
        subject_aliases = {
            "cs": "computer science",
            "se": "software engineering",
            "it": "information technology",
            "ai": "artificial intelligence",
            "ml": "machine learning",
        }

        # Find which subject the job requires
        req_subject = None
        for subj in subject_keywords:
            if subj in req_edu_lower:
                req_subject = subj
                break

        subject_ok = True  # Default: pass if no specific subject required
        if req_subject:
            # Check for literal match, abbreviation match, or token-based overlap
            alias = subject_aliases.get(req_subject)
            if req_subject in cv_lower:
                subject_ok = True
            elif alias and alias in cv_lower:
                subject_ok = True
            else:
                # Token-based fallback (e.g. "Computer Science" matches "CS" if tokens overlap)
                req_tokens = _tokenize(req_subject)
                if alias:
                    req_tokens.update(_tokenize(alias))
                
                subject_ok = bool(req_tokens & cv_tokens)

        # FINAL EDUCATION VERDICT
        if level_ok and subject_ok:
            education_score = 100.0
            edu_passed = True
        elif level_ok and not subject_ok:
            education_score = 40.0   # Has the degree, wrong field
            edu_passed = False       # HARD FAIL — wrong subject
        elif not level_ok and subject_ok:
            education_score = 30.0   # Right field, insufficient degree
            edu_passed = False       # HARD FAIL — degree too low
        else:
            education_score = 10.0   # Wrong level AND wrong subject
            edu_passed = False       # HARD FAIL

        edu_notes = (
            f"Required: {required_education}. "
            f"Found level: {cv_level or 'None'} ({'OK' if level_ok else 'INSUFFICIENT'}). "
            f"Required subject: {req_subject or 'any'}. "
            f"Subject match: {'YES' if subject_ok else 'NO'}. "
            f"PASSED: {'Yes' if edu_passed else 'NO'}"
        )
    else:
        education_score = 70.0
        edu_notes = "No specific education requirement set"

    # ── Weighted total (skills 50, exp 30, edu 20) ──────────────────────────
    total = (skills_score * 0.50) + (experience_score * 0.30) + (education_score * 0.20)
    total = round(min(total, 100.0), 1)

    return {
        "total_score": total,
        "skills_score": round(skills_score, 1),
        "experience_score": round(experience_score, 1),
        "education_score": round(education_score, 1),
        "experience_passed": exp_passed,
        "education_passed": edu_passed,
        "breakdown": {
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "experience_notes": exp_notes,
            "education_notes": edu_notes,
        }
    }


def _zero_result(reason: str) -> Dict:
    return {
        "total_score": 0.0,
        "skills_score": 0.0,
        "experience_score": 0.0,
        "education_score": 0.0,
        "breakdown": {"reason": reason}
    }
