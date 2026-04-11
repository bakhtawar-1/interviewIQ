"""Rule-based features for the TF-IDF + Ridge scoring pipeline.

Kept in a dedicated module so pickle can resolve FunctionTransformer on load
(when ml/ is on sys.path, same as scorer.py).
"""
import re
import numpy as np


def rule_features(texts):
    """Hand-crafted features that the ML model alone misses"""
    result = []
    for text in texts:
        parts = text.split('[SEP]')
        answer = parts[1].strip() if len(parts) > 1 else text
        a = answer.lower()
        words = a.split()
        wc = len(words)

        # STAR components
        S = int(any(w in a for w in ['when', 'during', 'once', 'at my', 'in my', 'time i', 'while working', 'there was']))
        T = int(any(w in a for w in ['had to', 'needed to', 'responsible', 'my role', 'task', 'challenge', 'assigned', 'goal was']))
        A = int(any(w in a for w in ['i did', 'i took', 'i led', 'i built', 'i created', 'i coordinated', 'i worked', 'i implemented', 'i proposed', 'i decided', 'i started', 'i prioritized', 'i designed', 'i managed']))
        R = int(any(w in a for w in ['result', 'outcome', 'delivered', 'achieved', 'improved', 'increased', 'reduced', 'completed', 'shipped', 'launched', 'succeeded', 'received', 'saved', 'generated']))

        # Metrics / numbers
        has_pct = int(bool(re.search(r'\d+\s*%', a)))
        has_number = int(bool(re.search(r'\b\d+\b', a)))
        has_metric = int(bool(re.search(r'\d+\s*(days?|weeks?|months?|hours?|users?|people|members?|million|thousand|k\b)', a)))

        # Quality signals
        filler_count = len(re.findall(r'\b(um|uh|like|basically|literally|you know|kind of|sort of|i mean|just|stuff)\b', a))
        vague_count = len(re.findall(r'\b(worked hard|did my best|figured it out|got it done|managed to|it was fine|handled it|everything went well)\b', a))
        specific_verbs = len(re.findall(r'\b(designed|architected|implemented|optimized|refactored|automated|reduced|increased|improved|delivered|shipped|launched|built|created|led|managed|mentored|trained|saved|generated)\b', a))

        # Security / DevOps themes (helps ML align with expanded labels)
        sec_patterns = [
            r'auth', r'authori[sz]', r'saniti[sz]', r'encrypt', r'https|tls',
            r'vulnerab', r'injection|xss|csrf', r'header', r'owasp',
        ]
        sec_themes = sum(1 for p in sec_patterns if re.search(p, a))
        has_cicd = int(bool(re.search(r'\bci\s*/?\s*cd\b|pipeline|deploy', a)))
        has_micro = int(bool(re.search(r'micro\s*services?|kubernetes|k8s|monolith', a)))

        # Length buckets
        l_vshort = int(wc < 10)
        l_short = int(10 <= wc < 30)
        l_medium = int(30 <= wc < 80)
        l_good = int(80 <= wc < 200)
        l_long = int(wc >= 200)

        result.append([
            S, T, A, R, S + T + A + R,
            has_pct, has_number, has_metric,
            specific_verbs,
            sec_themes, has_cicd, has_micro,
            filler_count, vague_count,
            l_vshort, l_short, l_medium, l_good, l_long,
            min(wc, 300) / 300,
        ])
    return np.array(result, dtype=float)
