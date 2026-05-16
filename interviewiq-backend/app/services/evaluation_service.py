"""
evaluation_service.py - AI Scoring with fallback
If sentence-transformers not installed, uses smart keyword + length scoring.
"""
from typing import Optional

_model = None

def _get_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            print("Loading AI model...")
            _model = SentenceTransformer('all-MiniLM-L6-v2')
            print("AI model ready!")
        except Exception:
            print("AI model not available, using smart keyword scoring.")
            _model = "fallback"
    return _model

def _cosine_similarity(vec1, vec2) -> float:
    try:
        import numpy as np
        v1, v2 = np.array(vec1), np.array(vec2)
        norm = np.linalg.norm(v1) * np.linalg.norm(v2)
        return float(np.dot(v1, v2) / norm) if norm > 0 else 0.0
    except:
        return 0.0

def _smart_keyword_score(response_text: str, ideal_answer: str, keywords: Optional[str]) -> float:
    """
    Smart scoring without AI model.
    Checks overlap between response and ideal answer words.
    Score out of 50 (same range as AI semantic score).
    """
    response_lower = response_text.lower()
    
    score = 0.0
    
    # Check ideal answer word overlap
    if ideal_answer:
        ideal_words = set(w.strip('.,!?;:') for w in ideal_answer.lower().split() if len(w) > 3)
        response_words = set(w.strip('.,!?;:') for w in response_lower.split() if len(w) > 3)
        if ideal_words:
            overlap = len(ideal_words & response_words) / len(ideal_words)
            score += overlap * 35  # up to 35 points

    # Check explicit keywords
    if keywords:
        if isinstance(keywords, list):
            kws = [k.strip().lower() for k in keywords if k.strip()]
        else:
            kws = [k.strip().lower() for k in keywords.split(",") if k.strip()]
            
        if kws:
            matched = sum(1 for kw in kws if kw in response_lower)
            score += (matched / len(kws)) * 15  # up to 15 points

    return round(min(score, 50.0), 2)

def _length_score(response_text: str) -> float:
    wc = len(response_text.strip().split())
    if wc < 10: return 0.0
    elif wc < 30: return 8.0
    elif wc < 60: return 14.0
    elif wc < 150: return 20.0
    else: return 18.0

def _keyword_bonus(response_text: str, keywords: Optional[str]) -> float:
    if not keywords:
        return 0.0
    
    if isinstance(keywords, list):
        kws = [k.strip().lower() for k in keywords if k.strip()]
    else:
        kws = [k.strip().lower() for k in keywords.split(",") if k.strip()]
        
    if not kws:
        return 0.0
    matched = sum(1 for kw in kws if kw in response_text.lower())
    return round((matched / len(kws)) * 30, 2)

def _generate_feedback(semantic_pct, response_text, keywords):
    parts = []
    wc = len(response_text.strip().split())

    if semantic_pct >= 70:
        parts.append("Your answer is highly relevant and well-aligned with what was expected.")
    elif semantic_pct >= 50:
        parts.append("Your answer is on the right track but could be more focused.")
    elif semantic_pct >= 30:
        parts.append("Your answer partially addresses the question. Try to be more specific.")
    else:
        parts.append("Your answer doesn't closely address the question. Try re-reading it carefully.")

    if wc < 10:
        parts.append("Way too short — aim for at least 3-4 sentences.")
    elif wc < 30:
        parts.append("Consider elaborating more with specific examples or details.")
    elif wc > 200:
        parts.append("Quite long — try to be more concise and focused.")

    if keywords:
        if isinstance(keywords, list):
            kws = [k.strip().lower() for k in keywords if k.strip()]
        else:
            kws = [k.strip().lower() for k in keywords.split(",") if k.strip()]
        missed = [kw for kw in kws if kw not in response_text.lower()]
        if missed[:3]:
            parts.append(f"Consider mentioning: {', '.join(missed[:3])}.")

    star_words = ['situation', 'task', 'action', 'result', 'when i', 'example', 'once']
    if not any(w in response_text.lower() for w in star_words) and wc > 20:
        parts.append("Tip: Use the STAR method — Situation, Task, Action, Result.")

    return " ".join(parts)

def score_response(response_text: str, ideal_answer: str, keywords: Optional[str] = None) -> tuple:
    if not response_text or not response_text.strip():
        return 0.0, "No response was provided."

    response_lower = response_text.strip().lower()
    garbage_phrases = ["i don't know", "i dont know", "no idea", "skip", "no i don't", "i don't", "no tell me", "no"]
    if response_lower in garbage_phrases or len(response_lower.split()) < 4:
        return 0.0, "Answer is too short or indicates skipping. Please provide a detailed response."

    model = _get_model()

    # AI Semantic Score (50 pts, or 80 if no keywords)
    if isinstance(keywords, list):
        has_keywords = bool(keywords and any(k.strip() for k in keywords))
    else:
        has_keywords = bool(keywords and [k.strip() for k in keywords.split(",") if k.strip()])
    max_semantic = 50.0 if has_keywords else 80.0

    semantic_score = 0.0
    if model != "fallback" and ideal_answer and ideal_answer.strip():
        try:
            embeddings = model.encode([response_text, ideal_answer])
            similarity = _cosine_similarity(embeddings[0], embeddings[1])
            similarity_clamped = max(0.0, similarity)
            semantic_score = round(similarity_clamped * max_semantic, 2)
        except Exception as e:
            print(f"AI error: {e}, using smart scoring")
            base_score = _smart_keyword_score(response_text, ideal_answer, keywords)
            semantic_score = round((base_score / 50.0) * max_semantic, 2)
    else:
        # Smart fallback — never returns 0 for a real answer
        base_score = _smart_keyword_score(response_text, ideal_answer or "", keywords)
        semantic_score = round((base_score / 50.0) * max_semantic, 2)

    # Keyword bonus (30 pts if keywords present, else 0)
    kw_score = _keyword_bonus(response_text, keywords)

    # Length score (20 pts)
    len_score = _length_score(response_text)

    total = round(min(semantic_score + kw_score + len_score, 100.0), 2)
    
    # Safety net: if someone wrote a real answer, give at least 10 points
    wc = len(response_text.strip().split())
    if wc >= 10 and total < 10:
        total = 10.0

    feedback = _generate_feedback(
        semantic_pct=(semantic_score / max_semantic) * 100 if max_semantic > 0 else 0,
        response_text=response_text,
        keywords=keywords
    )
    return total, feedback

def generate_summary_feedback(responses: list) -> dict:
    if not responses:
        return {"strengths": "No responses.", "weaknesses": "No responses.", "recommendations": "Complete the interview first."}

    scored = [r for r in responses if r.score is not None]
    avg = sum(r.score for r in scored) / len(scored) if scored else 0

    if avg >= 75:
        strength = "Excellent performance! Your answers were detailed and highly relevant."
    elif avg >= 55:
        strength = "Good performance. Most answers were on track with solid examples."
    elif avg >= 35:
        strength = "Decent attempt. You showed willingness to engage with the questions."
    else:
        strength = "This was a learning experience. Keep practicing and you will improve."

    if len(responses) >= 3:
        strength += f" You completed all {len(responses)} questions."

    weakness_parts = []
    if avg < 50:
        weakness_parts.append("Many answers lacked depth and specific examples.")
    low = [r for r in scored if len(r.response_text.split()) < 30]
    if low:
        weakness_parts.append(f"{len(low)} answer(s) were too brief.")
    if not weakness_parts:
        weakness_parts.append("Minor improvements possible in answer structure and specificity.")

    recs = ["Practice the STAR method for behavioral questions."]
    if avg < 70:
        recs.append("Review common questions in your target category and practice answers out loud.")
    recs.append("Retake this interview after practicing — you will see clear improvement!")

    return {
        "strengths": strength,
        "weaknesses": " ".join(weakness_parts),
        "recommendations": " ".join(recs)
    }
