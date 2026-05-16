"""
question_generator.py — Dynamic interview question generation

Two modes:
1. CV-based: generates questions from parsed CV content
2. Role-based: generates questions from job role + category
3. Follow-up: generates follow-up based on previous answer

No external AI used — pure rule-based + template system with randomization.
"""

import random
import re
from typing import Optional

# ── Seed for reproducibility within a session (shuffle changes per call) ──────
# Don't set a global seed — we WANT different questions each session


# ─────────────────────────────────────────────────────────────────────────────
# LARGE QUESTION BANK (shuffled per session)
# ─────────────────────────────────────────────────────────────────────────────

BEHAVIORAL_QUESTIONS = [
    {"text": "Tell me about a time you worked effectively under extreme pressure.", "keywords": ["pressure","deadline","result","calm","prioritized","delivered"]},
    {"text": "Describe a situation where you had to resolve a conflict within your team.", "keywords": ["conflict","communication","resolution","empathy","outcome"]},
    {"text": "Give me an example of a goal you set and the steps you took to achieve it.", "keywords": ["goal","planning","steps","obstacles","result","achieved"]},
    {"text": "Tell me about a time you demonstrated strong leadership.", "keywords": ["leadership","initiative","team","decision","motivated","outcome"]},
    {"text": "Describe a time you had to learn a new skill or technology very quickly.", "keywords": ["learning","adaptability","practiced","applied","growth","quickly"]},
    {"text": "Tell me about a project that failed. What did you do and what did you learn?", "keywords": ["failure","lesson","learned","improved","accountability","reflection"]},
    {"text": "Describe a time you had to convince a skeptical stakeholder or manager.", "keywords": ["persuasion","data","communication","stakeholder","outcome","convinced"]},
    {"text": "Tell me about a time you went above and beyond your job responsibilities.", "keywords": ["initiative","extra","ownership","impact","delivered","proactive"]},
    {"text": "Describe a situation where you had to make a difficult decision with limited information.", "keywords": ["decision","ambiguity","risk","analysis","outcome","judgment"]},
    {"text": "Tell me about a time you received harsh criticism. How did you respond?", "keywords": ["feedback","reflection","improved","growth","response","professional"]},
    {"text": "Describe a time you had to manage multiple priorities simultaneously.", "keywords": ["prioritization","multitasking","organized","delivered","communicated","deadlines"]},
    {"text": "Tell me about a time you disagreed with your manager's decision.", "keywords": ["disagreement","communication","respect","outcome","professional","resolved"]},
    {"text": "Describe a situation where you had to adapt to a major unexpected change.", "keywords": ["adaptability","change","flexible","adjusted","outcome","resilience"]},
    {"text": "Tell me about the most challenging problem you have ever solved at work.", "keywords": ["challenge","analysis","solution","creative","outcome","impact"]},
    {"text": "Describe a time when you helped a struggling colleague improve their performance.", "keywords": ["mentoring","support","coaching","improvement","empathy","teamwork"]},
    {"text": "Tell me about a time you identified a process inefficiency and fixed it.", "keywords": ["improvement","initiative","process","efficiency","impact","outcome"]},
    {"text": "Describe a situation where you had to deliver bad news to your team or manager.", "keywords": ["communication","honesty","transparency","sensitivity","outcome","professional"]},
    {"text": "Tell me about a time you successfully managed a project from start to finish.", "keywords": ["planning","execution","milestones","delivered","communication","outcome"]},
    {"text": "Describe a time you had to work with a very difficult colleague.", "keywords": ["interpersonal","patience","communication","professionalism","outcome","resolved"]},
    {"text": "Tell me about a time you took a risk at work. Did it pay off?", "keywords": ["risk","calculated","outcome","brave","decision","result"]},
]

TECHNICAL_QUESTIONS = {
    'general': [
        {"text": "Explain the difference between authentication and authorization with a real example.", "keywords": ["authentication","authorization","identity","permissions","roles","example"]},
        {"text": "How do you ensure code quality in a team setting?", "keywords": ["code review","testing","standards","ci/cd","documentation","quality"]},
        {"text": "Walk me through how you would debug a production issue affecting users.", "keywords": ["debugging","logs","monitoring","reproduce","fix","rollback","communication"]},
        {"text": "How do you approach system design for a new feature?", "keywords": ["requirements","scalability","database","api","trade-offs","architecture"]},
        {"text": "What is your approach to writing tests?", "keywords": ["unit","integration","coverage","tdd","mocking","confidence"]},
        {"text": "Explain the CAP theorem and when you would sacrifice consistency for availability.", "keywords": ["consistency","availability","partition","trade-off","distributed","example"]},
        {"text": "How do you handle database migrations in production without downtime?", "keywords": ["migration","backward compatible","rollback","blue-green","zero downtime","strategy"]},
        {"text": "What strategies do you use to optimize a slow API endpoint?", "keywords": ["profiling","caching","database","indexing","pagination","async"]},
        {"text": "Explain the difference between horizontal and vertical scaling.", "keywords": ["horizontal","vertical","load balancer","stateless","database","cost"]},
        {"text": "How do you approach security in a web application?", "keywords": ["authentication","sql injection","xss","csrf","https","secrets","input validation"]},
    ],
    'frontend': [
        {"text": "Explain the virtual DOM and why React uses it.", "keywords": ["virtual dom","reconciliation","diffing","performance","re-render","real dom"]},
        {"text": "How do you manage state in a large React application?", "keywords": ["state","context","redux","zustand","props","lifting","performance"]},
        {"text": "What are your strategies for optimizing web performance?", "keywords": ["lazy loading","code splitting","caching","cdn","lighthouse","bundle size","images"]},
        {"text": "Explain the difference between server-side rendering and client-side rendering.", "keywords": ["ssr","csr","seo","hydration","next.js","performance","first paint"]},
        {"text": "How do you handle accessibility in your frontend work?", "keywords": ["aria","semantic","keyboard","screen reader","contrast","wcag","focus"]},
    ],
    'backend': [
        {"text": "How do you design a RESTful API? What makes a good API?", "keywords": ["rest","endpoints","versioning","status codes","documentation","idempotent","stateless"]},
        {"text": "Explain how you would implement caching in a backend service.", "keywords": ["redis","cache invalidation","ttl","hit rate","strategy","consistency"]},
        {"text": "How do you handle concurrency and race conditions in your backend?", "keywords": ["locks","transactions","atomic","queue","idempotent","mutex"]},
        {"text": "Describe how you would architect a notification system.", "keywords": ["queue","async","kafka","websocket","retry","scalability","delivery"]},
        {"text": "How do you approach logging and monitoring in production?", "keywords": ["structured logs","metrics","alerts","tracing","observability","sla"]},
    ],
    'data': [
        {"text": "Explain the difference between a data warehouse and a data lake.", "keywords": ["structured","unstructured","schema","etl","analytics","storage","query"]},
        {"text": "How do you handle missing or dirty data in a dataset?", "keywords": ["imputation","outliers","validation","cleaning","impact","documented"]},
        {"text": "Walk me through how you would approach building a recommendation system.", "keywords": ["collaborative filtering","content based","matrix factorization","cold start","evaluation"]},
        {"text": "Explain overfitting and how you prevent it.", "keywords": ["overfitting","regularization","cross-validation","dropout","bias-variance","training"]},
    ],
    'devops': [
        {"text": "Explain your CI/CD pipeline setup.", "keywords": ["ci","cd","pipeline","testing","deployment","rollback","automation","stages"]},
        {"text": "How do you manage infrastructure as code?", "keywords": ["terraform","ansible","idempotent","version control","modules","state"]},
        {"text": "What is your approach to container orchestration?", "keywords": ["kubernetes","docker","pods","scaling","health checks","services","ingress"]},
        {"text": "How do you handle secrets and credentials securely?", "keywords": ["vault","environment variables","rotation","least privilege","encryption","audit"]},
    ],
}

HR_QUESTIONS = [
    {"text": "Tell me about yourself and your professional journey.", "keywords": ["background","skills","experience","goals","progression","relevant"]},
    {"text": "Why are you leaving your current role?", "keywords": ["growth","opportunity","challenge","positive","professional","forward"]},
    {"text": "Where do you see yourself professionally in 3-5 years?", "keywords": ["growth","goals","skills","leadership","contribute","aligned"]},
    {"text": "What are your two or three greatest professional strengths? Give examples.", "keywords": ["strength","example","impact","demonstrated","specific","evidence"]},
    {"text": "What is your biggest weakness and what are you doing to address it?", "keywords": ["weakness","awareness","improving","action","growth","honest"]},
    {"text": "Why do you want to work here specifically?", "keywords": ["research","mission","product","culture","aligned","contribute","specific"]},
    {"text": "What does your ideal work environment look like?", "keywords": ["culture","collaboration","autonomy","communication","growth","support"]},
    {"text": "How do you handle work-life balance during high-pressure periods?", "keywords": ["boundaries","prioritize","sustainable","communicate","recovery","organized"]},
    {"text": "What is your salary expectation for this role?", "keywords": ["market","research","flexible","value","negotiable","range"]},
    {"text": "Do you have any questions for us?", "keywords": ["team","challenges","success","culture","growth","role"]},
]

# ── Role → category mapping ────────────────────────────────────────────────────
ROLE_MAPPINGS = {
    # Frontend roles
    'frontend':      ['frontend', 'general'],
    'react':         ['frontend', 'general'],
    'vue':           ['frontend', 'general'],
    'angular':       ['frontend', 'general'],
    'ui':            ['frontend', 'general'],
    'ux':            ['frontend', 'general'],
    # Backend roles
    'backend':       ['backend', 'general'],
    'api':           ['backend', 'general'],
    'node':          ['backend', 'general'],
    'python':        ['backend', 'general'],
    'django':        ['backend', 'general'],
    'fastapi':       ['backend', 'general'],
    # Data roles
    'data':          ['data', 'general'],
    'ml':            ['data', 'general'],
    'machine learning': ['data', 'general'],
    'ai':            ['data', 'general'],
    'analyst':       ['data', 'general'],
    'scientist':     ['data', 'general'],
    # DevOps roles
    'devops':        ['devops', 'general'],
    'infrastructure':['devops', 'general'],
    'cloud':         ['devops', 'general'],
    'aws':           ['devops', 'general'],
    'kubernetes':    ['devops', 'general'],
    'docker':        ['devops', 'general'],
    # Full stack
    'full stack':    ['frontend', 'backend', 'general'],
    'fullstack':     ['frontend', 'backend', 'general'],
}


def _get_tech_questions_for_role(role: str, skills: list = None) -> list:
    """Get relevant technical questions based on role and skills"""
    role_lower = (role or '').lower()
    skills_lower = [s.lower() for s in (skills or [])]
    combined = role_lower + ' ' + ' '.join(skills_lower)

    categories = set()
    for keyword, cats in ROLE_MAPPINGS.items():
        if keyword in combined:
            categories.update(cats)

    if not categories:
        categories = {'general'}

    questions = []
    for cat in categories:
        questions.extend(TECHNICAL_QUESTIONS.get(cat, []))

    # Deduplicate
    seen = set()
    unique = []
    for q in questions:
        if q['text'] not in seen:
            seen.add(q['text'])
            unique.append(q)

    return unique


# ── CV-based question templates ───────────────────────────────────────────────
CV_QUESTION_TEMPLATES = {
    'skill': [
        "I see you have experience with {skill}. Can you walk me through a project where you used it and what challenges you faced?",
        "You listed {skill} as a skill. Tell me about the most complex thing you built using {skill}.",
        "How long have you been working with {skill} and what is the most valuable thing you have learned about it?",
        "Describe a specific problem you solved using {skill} that you are particularly proud of.",
    ],
    'job_title': [
        "As a {title}, what was the biggest technical challenge you solved in that role?",
        "What did a typical day look like for you as a {title}?",
        "What was the most impactful project you delivered as a {title}?",
        "What would you do differently in your {title} role if you could go back?",
    ],
    'experience': [
        "With {years} years of experience, what is the single most important lesson you have learned about software development?",
        "Given your {years} years in the industry, how has your approach to problem-solving evolved?",
    ],
}

FOLLOW_UP_TEMPLATES = {
    'short_answer': [
        "Can you go into more detail about that? Specifically, what were the exact steps you took?",
        "That is interesting — can you quantify the impact? What were the measurable results?",
        "Walk me through that more carefully. What was the biggest obstacle you faced?",
        "Can you give me a more specific example? Tell me what happened step by step.",
    ],
    'good_answer_probe': [
        "Excellent. Now thinking about that experience — what would you do differently today?",
        "You mentioned {keyword}. Can you tell me more about how you specifically handled that aspect?",
        "That is a strong example. How did you ensure the solution was maintainable long-term?",
        "Great. How did this experience change the way you approach similar situations now?",
    ],
    'technical_depth': [
        "Let us go deeper on that. What were the technical trade-offs you considered?",
        "How did you decide on that approach versus alternatives you might have used?",
        "What would happen to your solution if the scale increased by 10x?",
        "How did you test and validate that your solution was correct?",
    ],
    'missed_result': [
        "You mentioned what you did, but what was the actual outcome? How did it affect the team or business?",
        "What were the measurable results of that work?",
        "How did you know you were successful? What metrics did you track?",
    ],
    'missed_action': [
        "You described the situation well. Now tell me — what specific actions did YOU personally take?",
        "What was your individual contribution specifically, separate from the team?",
    ],
}


# ── Main public functions ──────────────────────────────────────────────────────

def generate_questions_from_cv(cv_data: dict, count: int = 5) -> list:
    """
    Generate interview questions based on parsed CV data.
    Mix: 2 CV-specific + 2 behavioral + 1 HR

    Args:
        cv_data: output from cv_parser.parse_cv()
        count: number of questions to generate

    Returns:
        list of {text, keywords, type, ideal} dicts
    """
    questions = []

    skills    = cv_data.get('skills', [])
    titles    = cv_data.get('job_titles', [])
    exp_years = cv_data.get('experience_years', 0)

    # ── CV-specific questions ──────────────────────────────────────────────
    cv_questions = []

    # Skill-based questions (pick 2-3 top skills)
    for skill in skills[:4]:
        template = random.choice(CV_QUESTION_TEMPLATES['skill'])
        text = template.format(skill=skill.title())
        cv_questions.append({
            'text': text,
            'keywords': [skill, 'project', 'challenge', 'result', 'built'],
            'type': 'cv_skill',
            'ideal': f'specific project using {skill} challenge faced solution result impact',
        })

    # Job title questions
    for title in titles[:2]:
        template = random.choice(CV_QUESTION_TEMPLATES['job_title'])
        text = template.format(title=title)
        cv_questions.append({
            'text': text,
            'keywords': ['challenge', 'project', 'result', 'team', 'delivered'],
            'type': 'cv_role',
            'ideal': f'{title} role responsibilities challenges outcomes impact delivered',
        })

    # Experience question
    if exp_years >= 2:
        template = random.choice(CV_QUESTION_TEMPLATES['experience'])
        text = template.format(years=exp_years)
        cv_questions.append({
            'text': text,
            'keywords': ['lesson', 'learned', 'experience', 'improved', 'evolved'],
            'type': 'cv_experience',
            'ideal': 'specific lesson learned over career experience growth evolved professional',
        })

    # Shuffle and pick 2 CV-specific questions
    random.shuffle(cv_questions)
    questions.extend(cv_questions[:2])

    # ── Technical questions based on role ──────────────────────────────────
    role = ' '.join(titles[:1] + skills[:3])
    tech_qs = _get_tech_questions_for_role(role, skills)
    random.shuffle(tech_qs)
    for q in tech_qs[:1]:
        questions.append({**q, 'type': 'technical', 'ideal': ' '.join(q['keywords'])})

    # ── Behavioral questions ───────────────────────────────────────────────
    behavioral = list(BEHAVIORAL_QUESTIONS)
    random.shuffle(behavioral)
    for q in behavioral[:1]:
        questions.append({**q, 'type': 'behavioral', 'ideal': ' '.join(q['keywords'])})

    # ── HR question ────────────────────────────────────────────────────────
    hr = list(HR_QUESTIONS[:6])
    random.shuffle(hr)
    q = hr[0]
    questions.append({**q, 'type': 'hr', 'ideal': ' '.join(q['keywords'])})

    # Pad if needed
    if len(questions) < count:
        extra_behavioral = [q for q in BEHAVIORAL_QUESTIONS if q not in questions]
        random.shuffle(extra_behavioral)
        for q in extra_behavioral[:count - len(questions)]:
            questions.append({**q, 'type': 'behavioral', 'ideal': ' '.join(q['keywords'])})

    return questions[:count]


def generate_questions_from_role(role: str, category: str = 'mixed', count: int = 5) -> list:
    """
    Generate shuffled questions based on job role and category.
    Used when no CV is uploaded.

    Args:
        role: job role string e.g. "React Developer"
        category: behavioral | technical | hr | mixed
        count: number of questions

    Returns:
        list of question dicts
    """
    questions = []

    if category == 'behavioral':
        pool = list(BEHAVIORAL_QUESTIONS)
        random.shuffle(pool)
        questions = pool[:count]

    elif category == 'technical':
        tech_pool = _get_tech_questions_for_role(role)
        random.shuffle(tech_pool)
        questions = tech_pool[:count]
        # pad with general if not enough
        if len(questions) < count:
            general = list(TECHNICAL_QUESTIONS['general'])
            random.shuffle(general)
            questions.extend(general[:count - len(questions)])

    elif category == 'hr':
        pool = list(HR_QUESTIONS)
        random.shuffle(pool)
        questions = pool[:count]

    else:  # mixed
        behavioral = list(BEHAVIORAL_QUESTIONS)
        random.shuffle(behavioral)
        tech = _get_tech_questions_for_role(role)
        random.shuffle(tech)
        hr = list(HR_QUESTIONS)
        random.shuffle(hr)

        b_count = max(1, int(count * 0.4))
        t_count = max(1, int(count * 0.4))
        h_count = count - b_count - t_count
        if h_count < 0: h_count = 0

        questions = (
            behavioral[:b_count] +
            tech[:t_count] +
            hr[:h_count]
        )
        
        # Pad with general if we didn't have enough in the specific pools
        if len(questions) < count:
            general = list(TECHNICAL_QUESTIONS.get('general', [])) + list(BEHAVIORAL_QUESTIONS)
            random.shuffle(general)
            seen_texts = {q['text'] for q in questions}
            for g_q in general:
                if g_q['text'] not in seen_texts:
                    questions.append(g_q)
                    seen_texts.add(g_q['text'])
                if len(questions) == count:
                    break

        random.shuffle(questions)

    return [
        {**q, 'type': category, 'ideal': ' '.join(q['keywords'])}
        for q in questions[:count]
    ]


# Negative / empty answer indicators — means candidate has nothing to share
EMPTY_SIGNALS = [
    'none', 'no', 'nothing', "i don't", "i haven't", "i have not",
    "i never", "not yet", "no experience", "no project", "haven't done",
    "haven't worked", "i didn't", "i did not", "not applicable", "n/a",
    "not really", "i'm not sure", "i don't know", "no idea",
]

# Substantive content indicators — answer has something worth probing
SUBSTANCE_SIGNALS = [
    'i ', 'my ', 'we ', 'our ', 'when ', 'during ', 'project', 'worked',
    'built', 'created', 'led', 'managed', 'designed', 'solved', 'achieved',
    'delivered', 'improved', 'developed', 'implemented', 'team', 'company',
]


def generate_followup(
    previous_question: str,
    previous_answer: str,
    score: int,
    breakdown: dict,
) -> Optional[dict]:
    """
    Generate a follow-up ONLY when the answer contains real substance worth probing.

    Rules:
    - NEVER follow up if answer is empty/negative ("none", "no", "I don't know")
    - NEVER follow up if answer is under 15 words (nothing to probe)
    - NEVER follow up if score >= 75 and answer >= 80 words (complete answer)
    - Follow up only when answer has substance but is missing result OR action
    - Follow up when answer mentions something specific worth exploring deeper
    """
    answer = (previous_answer or '').strip()
    answer_lower = answer.lower()
    wc = len(answer_lower.split())
    star = breakdown.get('star_components', {})

    # ── Gate 1: Empty or negative answer — NO follow-up ──────────────────────
    # If they said "none", "no", "I haven't" etc., there's nothing to probe
    if wc < 8:
        return None

    first_words = ' '.join(answer_lower.split()[:12])
    if any(sig in first_words for sig in EMPTY_SIGNALS):
        return None

    # ── Gate 2: Answer has no real substance — NO follow-up ──────────────────
    # Count how many substance signals appear
    substance_count = sum(1 for sig in SUBSTANCE_SIGNALS if sig in answer_lower)
    if substance_count < 2:
        return None  # too vague to probe — "It was fine", "I handled it"

    # ── Gate 3: Answer is complete — NO follow-up ─────────────────────────────
    all_star = star.get('S') and star.get('T') and star.get('A') and star.get('R')
    if score >= 75 and wc >= 40:
        return None  # good score + reasonable length = done
    if all_star and score >= 65:
        return None  # complete STAR answer — move on
    if score >= 80:
        return None  # very high score regardless = done

    # ── Now decide WHAT to follow up on ───────────────────────────────────────

    # Missing result but HAS situation + action — most useful follow-up
    if star.get('S') and star.get('A') and not star.get('R'):
        template = random.choice(FOLLOW_UP_TEMPLATES['missed_result'])
        return _make_followup(template)

    # Has situation but missing personal action
    if star.get('S') and not star.get('A') and wc > 20:
        template = random.choice(FOLLOW_UP_TEMPLATES['missed_action'])
        return _make_followup(template)

    # Good substantive answer — probe one specific thing they mentioned
    if score >= 45 and wc >= 30:
        # Find something concrete they mentioned to ask about
        interesting = [
            k for k in ['challenge', 'problem', 'team', 'decision', 'result',
                         'approach', 'solution', 'leadership', 'conflict', 'failure']
            if k in answer_lower
        ]
        if interesting:
            keyword = random.choice(interesting)
            template = random.choice(FOLLOW_UP_TEMPLATES['good_answer_probe'])
            return _make_followup(template.format(keyword=keyword))

    # Medium answer with substance but not much detail
    if score < 55 and wc >= 20 and substance_count >= 3:
        template = random.choice(FOLLOW_UP_TEMPLATES['short_answer'])
        return _make_followup(template)

    # Default: no follow-up
    return None


def _make_followup(text: str) -> dict:
    return {
        'text': text,
        'keywords': ['specific', 'detail', 'result', 'impact', 'outcome'],
        'type': 'followup',
        'ideal': 'specific detail measurable result impact outcome',
        'is_followup': True,
    }
