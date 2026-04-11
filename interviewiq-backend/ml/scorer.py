"""
scorer.py — Answer scoring engine
Loaded once at FastAPI startup, used for every /api/score-answer call.

How it works:
1. ML model (TF-IDF + Ridge) gives a base score from training data
2. Rule-based adjustments fine-tune based on STAR structure, length, specificity
3. Feedback is generated from the specific gaps found
"""

import os
import re
import pickle
import numpy as np

# ── Load model once at import time ────────────────────────────────────────────
_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'scorer.pkl')
_model = None

def _get_model():
    global _model
    if _model is None:
        if not os.path.exists(_MODEL_PATH):
            raise FileNotFoundError(
                f"Model not found at {_MODEL_PATH}. "
                "Run: python3 ml/train.py"
            )
        import rule_features  # noqa: F401 — pipeline pickle references this module
        with open(_MODEL_PATH, 'rb') as f:
            _model = pickle.load(f)
    return _model


# ── Rule-based feature extraction ─────────────────────────────────────────────
def _extract_features(answer: str) -> dict:
    text  = answer.lower().strip()
    words = text.split()
    wc    = len(words)

    # ── STAR detection ────────────────────────────────────────────────────────
    situation = any(w in text for w in [
        'when ', 'during ', 'once ', 'at my ', 'in my ',
        'situation', 'time i ', 'time when', 'there was', 'last year',
        'in my previous', 'at the company', 'while working'
    ])
    task = any(w in text for w in [
        'had to', 'needed to', 'responsible', 'my role', 'my job',
        'task', 'challenge', 'goal was', 'objective', 'assigned'
    ])
    action = any(w in text for w in [
        'i did', 'i took', 'i decided', 'i led', 'i built',
        'i created', 'i coordinated', 'i worked', 'i implemented',
        'i proposed', 'i communicated', 'i asked', 'i started', 'i prioritized',
        'i approach', 'i follow', 'we use', 'we enforce', 'we implement',
        'built ', 'built a', 'developed', 'designed', 'wrote', 'using ',
        'optimised', 'optimized', 'multithreaded', 'pipeline', 'compression',
        'enforcing', 'validating', 'introduced', 'standardised', 'standardized',
        'identified', 'redesign', 'redesigned',
    ])
    result = any(w in text for w in [
        'result', 'outcome', 'end result', 'finally', 'delivered',
        'achieved', 'improved', 'increased', 'reduced', 'completed',
        'shipped', 'launched', 'finished', 'succeeded', 'received',
        'performance', 'speed', 'reports', 'generated', 'handled', 'visualised',
        'visualized', 'resource', 'on time', 'deliver'
    ])

    star_count = sum([situation, task, action, result])
    star_bonus = star_count * 5  # up to +20

    # ── Length score ──────────────────────────────────────────────────────────
    if   wc < 5:   length_bonus = -10
    elif wc < 15:  length_bonus = 0
    elif wc < 30:  length_bonus = 5
    elif wc < 60:  length_bonus = 10
    elif wc < 120: length_bonus = 15
    elif wc < 200: length_bonus = 12
    else:          length_bonus = 8   # too long is also penalized

    # ── Specificity — numbers, metrics, percentages ───────────────────────────
    specific_patterns = [
        r'\d+\s*%',                    # percentages
        r'\d+\s*(days?|weeks?|months?|hours?|years?)',  # time
        r'\d+\s*(people|members|users|clients|engineers|developers)',  # team size
        r'\$\d+|\d+k|\d+m',           # money
        r'(doubled|tripled|halved)',   # ratio words
        r'(10x|2x|3x|50%|30%|20%)',   # multipliers
    ]
    specific_count = sum(len(re.findall(p, text)) for p in specific_patterns)
    specificity_bonus = min(specific_count * 4, 12)

    # ── Filler word penalty ───────────────────────────────────────────────────
    fillers = re.findall(
        r'\b(um|uh|like|basically|literally|you know|kind of|sort of|i mean|actually|just|stuff|things)\b',
        text
    )
    filler_penalty = min(len(fillers) * 2, 12)

    # ── Vagueness penalty ─────────────────────────────────────────────────────
    vague_phrases = ['worked hard', 'did my best', 'figured it out',
                     'got it done', 'managed to', 'it was fine', 'handled it']
    vague_count = sum(1 for v in vague_phrases if v in text)
    vague_penalty = min(vague_count * 5, 15)

    # Technical / substantive content (helps CV + coding interview answers)
    tech_terms = re.findall(
        r'\b(python|c\+\+|java|javascript|typescript|react|node|sql|api|rest|graphql|'
        r'database|thread|memory|pipeline|pandas|scalab|scalable|micro\s*services?|monolith|'
        r'architecture|architect|design|kubernetes|k8s|docker|aws|azure|gcp|git|'
        r'ci\s*/?\s*cd|deployment|deploy|automated|testing|debug|optimi[sz]e|feature|'
        r'authentication|authori[sz]ation|encrypt|saniti[sz]|https|tls|header|'
        r'vulnerab|penetration|owasp|csrf|token|privilege|parameteri[sz]ed|orm\b|'
        r'observability|reliability|downtime|latency|throughput)\b',
        text
    )
    technical_bonus = min(len(set(tech_terms)) * 3, 22)

    # Extra credit when several distinct security themes appear (common in "how do you approach security")
    sec_groups = [
        r'auth|authori[sz]|token',
        r'saniti[sz]|validat|input|inject|parameter',
        r'encrypt|tls|https',
        r'header|csp|hsts|cors',
        r'vulnerab|penetration|scan|owasp|threat',
    ]
    sec_breadth = sum(1 for p in sec_groups if re.search(p, text))
    if sec_breadth >= 3:
        technical_bonus = min(technical_bonus + min((sec_breadth - 2) * 4, 12), 28)

    return {
        'star': {'S': situation, 'T': task, 'A': action, 'R': result},
        'star_bonus':       star_bonus,
        'length_bonus':     length_bonus,
        'specificity_bonus': specificity_bonus,
        'filler_penalty':   filler_penalty,
        'vague_penalty':    vague_penalty,
        'technical_bonus':  technical_bonus,
        'sec_breadth':      sec_breadth,
        'word_count':       wc,
    }


def _question_style(question: str) -> str:
    q = (question or '').lower()
    if any(x in q for x in ('security', 'owasp', 'sql injection', 'xss', 'csrf')):
        return 'security'
    if any(x in q for x in ('typical day', 'day to day', 'day-to-day', 'responsibilit')):
        return 'routine'
    if 'strength' in q and ('greatest' in q or 'professional' in q or 'your two' in q):
        return 'strengths'
    if 'how do you approach' in q or 'how would you approach' in q:
        return 'approach'
    return 'default'


# ── Feedback generator ────────────────────────────────────────────────────────
def _generate_feedback(features: dict, score: int, question: str = '') -> str:
    parts = []
    star = features['star']
    wc   = features['word_count']
    style = _question_style(question)
    sec_breadth = int(features.get('sec_breadth', 0))
    tech = int(features.get('technical_bonus', 0))

    # Critical gaps first
    if wc < 15:
        return "Your answer is too brief. Aim for at least 5-6 sentences with a specific example."

    star_relaxed = style in ('security', 'approach', 'routine') and (
        sec_breadth >= 3 or tech >= 12 or (style == 'routine' and wc >= 18)
    )

    high_band = score >= 78
    if not star['S'] and not star_relaxed and not high_band:
        parts.append("Start with context — briefly describe the situation or project.")
    if not star['T'] and not (star_relaxed and style in ('security', 'approach')) and not high_band:
        parts.append("Clarify what YOUR specific task or responsibility was.")
    if not star['A'] and not high_band:
        parts.append("Focus on the concrete actions YOU personally took.")
    if not star['R'] and features.get('technical_bonus', 0) < 8:
        if not (star_relaxed and style in ('security', 'approach')) and not high_band:
            parts.append("Always end with the result — what was the outcome and impact?")

    if features['vague_penalty'] > 8:
        parts.append("Avoid vague phrases like 'worked hard' or 'figured it out' — be specific about what you did.")

    if features['specificity_bonus'] == 0 and wc > 30 and score < 82:
        parts.append("Add numbers or metrics — e.g. team size, time saved, percentage improvement.")

    if features['filler_penalty'] > 6:
        parts.append("Reduce filler words (like, basically, you know) for a more confident delivery.")

    # Positive reinforcement (varied openers for mid scores)
    if score >= 80:
        parts.insert(0, "Strong answer with good structure and specific details.")
    elif score >= 60:
        parts.insert(0, "Good attempt — a few improvements will make this much stronger.")
    elif score >= 40:
        if style == 'security' and sec_breadth >= 3:
            parts.insert(0, "You covered several important security themes; tightening with one example or metric would strengthen it.")
        elif style == 'routine' and wc >= 20:
            parts.insert(0, "Good coverage of how you spend your time; adding one measurable outcome would round it out.")
        elif style == 'strengths' and tech >= 6:
            parts.insert(0, "Strengths come through; tie each one to a single memorable outcome or scope if you can.")
        else:
            parts.insert(0, "Partially on track — add a bit more structure and one concrete detail.")

    if not parts:
        parts.append("Try using the STAR method: Situation → Task → Action → Result.")

    return ' '.join(parts)


# ── Main scoring function ─────────────────────────────────────────────────────
def score_answer(question: str, answer: str) -> dict:
    """
    Returns:
        score (int): 0-100
        feedback (str): actionable feedback sentence
        breakdown (dict): component scores for transparency
    """
    answer = (answer or '').strip()

    if not answer or len(answer.split()) < 3:
        return {
            'score': 5,
            'feedback': 'Please provide a complete answer — at least a few sentences.',
            'breakdown': {}
        }

    # ── ML base score ─────────────────────────────────────────────────────────
    model = _get_model()
    text  = f"{question.lower()} [SEP] {answer.lower()}"
    try:
        ml_raw = float(model.predict([text])[0])
        ml_raw = float(np.clip(ml_raw, 0, 100))
    except Exception:
        ml_raw = 50.0  # fallback if model fails

    # ── Rule-based adjustments ────────────────────────────────────────────────
    f = _extract_features(answer)

    # Blend: training data is small — weight rules higher so good structured answers score fairly
    rule_score = (
        48
        + f['star_bonus']
        + f['length_bonus']
        + f['specificity_bonus']
        + f.get('technical_bonus', 0)
        - f['filler_penalty']
        - f['vague_penalty']
    )
    rule_score = float(np.clip(rule_score, 0, 100))
    blended = ml_raw * 0.35 + rule_score * 0.65
    final_score = int(np.clip(round(blended), 0, 100))

    qstyle = _question_style(question)

    # Floor: long, substantive technical answers should not collapse into the 20s due to ML noise
    if f['word_count'] >= 28 and f.get('technical_bonus', 0) >= 9 and final_score < 52:
        final_score = min(78, max(final_score, 52))
    elif f['word_count'] >= 20 and f['star_bonus'] >= 10 and final_score < 45:
        final_score = min(72, max(final_score, 45))

    if qstyle == 'security' and f.get('sec_breadth', 0) >= 3 and f['word_count'] >= 14 and final_score < 58:
        final_score = min(82, max(final_score, 58))
    if qstyle in ('routine', 'strengths') and f['word_count'] >= 22 and f.get('technical_bonus', 0) >= 9 and final_score < 52:
        final_score = min(75, max(final_score, 52))

    feedback = _generate_feedback(f, final_score, question)

    return {
        'score': final_score,
        'feedback': feedback,
        'breakdown': {
            'ml_base':           round(ml_raw),
            'star_bonus':        f['star_bonus'],
            'length_bonus':      f['length_bonus'],
            'specificity_bonus': f['specificity_bonus'],
            'technical_bonus':   f.get('technical_bonus', 0),
            'filler_penalty':    -f['filler_penalty'],
            'vague_penalty':     -f['vague_penalty'],
            'star_components':   f['star'],
            'word_count':        f['word_count'],
            'sec_breadth':       f.get('sec_breadth', 0),
        }
    }
