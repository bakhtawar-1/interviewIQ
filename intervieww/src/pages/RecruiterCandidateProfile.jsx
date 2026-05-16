import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Sparkles,
  LogOut,
  Briefcase,
  ArrowLeft,
  Loader2,
  Download,
} from 'lucide-react';

import { API_URL } from '../config';

const RecruiterCandidateProfile = () => {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [user, setUser] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const load = useCallback(async () => {
    if (!token) {
      navigate('/signin');
      return;
    }
    setListError('');
    setDownloadError('');
    const headers = { Authorization: `Bearer ${token}` };
    const meRes = await fetch(`${API_URL}/api/auth/me`, { headers });
    if (meRes.status === 401) {
      navigate('/signin');
      return;
    }
    const meData = await meRes.json();
    setUser(meData);
    if (meData.role !== 'recruiter' && meData.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const idNum = Number(candidateId);
    if (!Number.isFinite(idNum)) {
      setCandidate(null);
      setInterviews([]);
      setLoading(false);
      return;
    }

    const cRes = await fetch(`${API_URL}/api/recruiter/candidates`, { headers });
    if (!cRes.ok) {
      setListError('Could not load candidates.');
      setLoading(false);
      return;
    }
    const all = await cRes.json();
    const c = all.find((x) => x.id === idNum);
    setCandidate(c || null);

    const iRes = await fetch(`${API_URL}/api/recruiter/candidates/${idNum}/interviews`, { headers });
    if (!iRes.ok) {
      const err = await iRes.json().catch(() => ({}));
      setListError(err.detail || 'Failed to load interviews.');
      setInterviews([]);
    } else {
      setInterviews(await iRes.json());
    }
    setLoading(false);
  }, [token, navigate, candidateId]);

  useEffect(() => {
    load();
  }, [load]);

  const downloadReport = async (inv) => {
    setDownloadError('');
    setDownloadingId(inv.id);
    try {
      const r = await fetch(
        `${API_URL}/api/recruiter/interviews/${inv.id}/report-document`,
        { headers: authHeaders }
      );
      if (!r.ok) {
        setDownloadError('Could not download report.');
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview-${inv.id}-report.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError('Download failed.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/signin');
  };

  const sessionScore = (inv) => {
    if (inv.overall_score != null) return `${Math.round(Number(inv.overall_score))}%`;
    return '—';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-sky-500/40 border-t-sky-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center px-6">
        <p className="text-zinc-400 mb-4 text-center">Candidate not found or you do not have access.</p>
        <Link
          to="/recruiter"
          className="text-sky-400 hover:text-sky-300 text-sm font-medium"
        >
          ← Back to recruiter workspace
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.12),transparent)]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-sky-950/20 blur-3xl rounded-full translate-y-1/2" />
      </div>

      <nav className="relative border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-[900px] mx-auto px-5 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 min-w-0 group">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 ring-1 ring-zinc-700/80 flex items-center justify-center shrink-0 group-hover:ring-sky-500/40 transition-shadow">
              <Sparkles className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base font-semibold text-zinc-100 tracking-tight truncate">
                InterviewIQ
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/25 shrink-0">
                Recruiter
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            {user?.role === 'admin' && (
              <Link
                to="/dashboard"
                className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors hidden sm:inline"
              >
                Candidate view
              </Link>
            )}
            <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-500">
              <Briefcase className="w-4 h-4 text-zinc-600" />
              <span className="text-zinc-300 max-w-[140px] truncate">{user?.full_name || 'Recruiter'}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-zinc-800/80 border border-transparent hover:border-zinc-700"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="relative max-w-[900px] mx-auto px-5 sm:px-8 py-8 sm:py-10">
        <Link
          to="/recruiter"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 mb-6 rounded-lg px-1 py-1 -ml-1 hover:bg-zinc-800/60 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All candidates
        </Link>

        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            {candidate.full_name}
          </h1>
          <p className="text-sm text-zinc-500 mt-1 truncate">{candidate.email}</p>
          {(candidate.job_roles || []).length > 0 && (
            <p className="text-xs text-zinc-500 mt-2">
              {(candidate.job_roles || []).join(' · ')}
            </p>
          )}
        </header>

        {listError && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-950/40 border border-red-500/25 text-red-200 text-sm">
            {listError}
          </div>
        )}
        {downloadError && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-950/40 border border-red-500/25 text-red-200 text-sm">
            {downloadError}
          </div>
        )}

        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
          Interview sessions
        </h2>

        {interviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 px-6 py-12 text-center text-zinc-500 text-sm">
            No interviews yet for this candidate.
          </div>
        ) : (
          <ul className="space-y-4 scrollbar-refined max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {interviews.map((inv) => (
                <li
                  key={inv.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">Score</p>
                    <p className="text-4xl sm:text-5xl font-semibold tabular-nums text-sky-400">
                      {sessionScore(inv)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadReport(inv)}
                    disabled={downloadingId === inv.id}
                    className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium border border-sky-500/30 disabled:opacity-50 transition-colors w-full sm:w-auto"
                  >
                    {downloadingId === inv.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Download full interview report
                  </button>
                </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RecruiterCandidateProfile;
