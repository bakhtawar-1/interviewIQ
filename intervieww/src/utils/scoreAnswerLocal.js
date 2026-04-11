/**
 * Local fallback when /api/interview/score-answer is unavailable.
 * Tuned for speech-to-text: rewards substance, implicit matches, question overlap.
 */
export function scoreAnswerLocal(responseText, idealText, keywords, questionText = '') {
  if (!responseText || responseText.trim().split(/\s+/).length < 3) {
    return { score: 5, feedback: 'Answer is too short — please elaborate more.' };
  }
  const resp = responseText.toLowerCase();
  const wc = responseText.trim().split(/\s+/).length;

  const kwList = Array.isArray(keywords) ? keywords : [];
  const ideal = (idealText || '').trim();
  const qLower = (questionText || '').toLowerCase();

  let refTokens = ideal
    ? ideal.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z0-9+]/g, '')).filter(w => w.length > 3)
    : qLower.split(/\s+/).map(w => w.replace(/[^a-z0-9+]/g, '')).filter(w => w.length > 3);
  const stop = new Set(['that', 'this', 'with', 'from', 'your', 'have', 'what', 'when', 'tell', 'about', 'most', 'thing', 'things', 'would', 'could', 'should']);
  refTokens = refTokens.filter(t => !stop.has(t));
  const respTokens = new Set(resp.split(/\s+/).map(w => w.replace(/[^a-z0-9+]/g, '')).filter(w => w.length > 2));

  let overlap = 0;
  for (const t of refTokens) {
    if (respTokens.has(t) || resp.includes(t)) overlap += 1;
  }
  const semantic = Math.min((overlap / Math.max(Math.min(refTokens.length, 12), 1)) * 48, 48);

  const impliesProject = /\b(built|building|pipeline|tool|system|app|module|service|compression|multithread|project|developed|created|designed|implementation|wrote)\b/.test(resp);
  const impliesResult = /\b(result|outcome|delivered|optimi[sz]ed|reduced|improved|performance|speed|reports|generated|handled|completed|deliver)\b/.test(resp);
  const impliesChallenge = /\b(complex|challenge|difficult|pressure|unexpected|changed|adapt|problem|issue)\b/.test(resp);

  let kwPoints = 0;
  const maxKw = Math.max(kwList.length, 1);
  for (const k of kwList) {
    const kl = String(k).toLowerCase();
    if (resp.includes(kl)) {
      kwPoints += 1;
      continue;
    }
    if (kl.includes(' ') && kl.split(/\s+/).every(part => resp.includes(part))) {
      kwPoints += 1;
      continue;
    }
    if (kl === 'project' && impliesProject) kwPoints += 0.85;
    else if (kl === 'challenge' && impliesChallenge) kwPoints += 0.85;
    else if ((kl === 'result' || kl === 'outcome') && impliesResult) kwPoints += 0.85;
    else if ((kl === 'trade-offs' || kl === 'tradeoffs') && (resp.includes('trade') || resp.includes('constraint'))) kwPoints += 0.7;
    else if (kl === 'scalability' && /\b(scalab|scale|load|performance)\b/.test(resp)) kwPoints += 0.75;
    else if (kl === 'database' && /\b(database|sql|postgres|mongo|schema|query)\b/.test(resp)) kwPoints += 0.75;
    else if (kl === 'api' && /\b(api|endpoint|rest|request)\b/.test(resp)) kwPoints += 0.75;
  }
  const kw = Math.min((kwPoints / maxKw) * 30, 30);

  let lenPts = 0;
  if (wc >= 8) lenPts += 7;
  if (wc >= 18) lenPts += 9;
  if (wc >= 35) lenPts += 9;
  if (wc >= 55) lenPts += 7;
  if (wc >= 25) lenPts += 4;

  const techPattern = /\b(python|c\+\+|java|typescript|javascript|react|node|sql|api|rest|graphql|database|thread|memory|pipeline|pandas|scalab|scalable|micro\s*services?|monolith|architecture|design|kubernetes|k8s|docker|aws|git|ci\s*\/?\s*cd|deployment|deploy|automated|test|debug|optimi[sz]e|feature|library|data|model|system|authentication|authori[sz]ation|encrypt|saniti[sz]|https|tls|header|vulnerab|owasp|csrf|token|privilege|latency|downtime|siem|firewall|phishing|malware|incident|nist|soc|endpoint|patch)\b/g;
  const techHits = (resp.match(techPattern) || []).length;
  let techPts = Math.min(techHits * 2.5, 22);
  const secGroups = [
    /auth|authori[sz]|token/,
    /saniti[sz]|validat|input|inject|parameter/,
    /encrypt|tls|https/,
    /header|csp|hsts|cors/,
    /vulnerab|penetration|scan|owasp|threat/,
  ];
  const secBreadth = secGroups.filter((re) => re.test(resp)).length;
  if (secBreadth >= 3 && /security|owasp|xss|csrf|injection|web application|analyst|threat|vulnerab/.test(qLower)) {
    techPts = Math.min(techPts + Math.min((secBreadth - 2) * 4, 12), 30);
  }

  const hasStarish = ['when ', 'during ', 'i built', 'i developed', 'i implemented', 'i approach', 'i follow', 'result', 'outcome', 'delivered'].some(s => resp.includes(s));
  let starPts = 0;
  if (hasStarish || impliesProject) starPts += 9;
  if (impliesResult) starPts += 7;

  let total = Math.round(semantic + kw + lenPts + techPts + starPts);
  total = Math.min(100, Math.max(15, total));

  if (secBreadth >= 3 && /security|owasp|sql injection|xss/.test(qLower) && wc >= 14 && total < 58) {
    total = Math.min(82, Math.max(total, 58));
  }
  if (/(typical day|day to day|day-to-day|responsibilit)/.test(qLower) && wc >= 22 && techHits >= 4 && total < 52) {
    total = Math.min(75, Math.max(total, 52));
  }

  const parts = [];
  const midOpeners = [
    'You hit the main themes — a named example or one metric would lift this further.',
    'Substance is there — tighten with a clear before/after or scope (team, users, timeline).',
    'On the right track — pick one story and spell out context, your role, and impact.',
  ];
  const midIdx = (resp.length + wc) % midOpeners.length;
  if (total >= 72) parts.push('Strong answer — good detail and relevance.');
  else if (total >= 55) parts.push('Solid answer — covers the question with useful detail.');
  else if (total >= 42) {
    if (secBreadth >= 3 && /security/.test(qLower)) {
      parts.push('Several solid security practices named — optional: one concrete incident or metric.');
    } else {
      parts.push(midOpeners[midIdx]);
    }
  } else parts.push('Add more specifics: what you did, tools used, and the outcome.');

  if (wc < 18) parts.push('A bit short — aim for a few more sentences when possible.');
  if (techHits >= 3 && total < 65 && !/security/.test(qLower)) {
    parts.push('Technical points are there — connect them explicitly to what was asked.');
  }

  const missed = kwList.filter(k => !resp.includes(String(k).toLowerCase()));
  if (missed.length > 0 && total < 70) {
    parts.push(`Optional depth: touch on ${missed.slice(0, 2).join(', ')} if relevant.`);
  }
  if (!hasStarish && wc > 25 && !impliesProject) {
    parts.push('Tip: briefly set context, then what you did, then the result.');
  }

  return { score: total, feedback: parts.join(' ') };
}
