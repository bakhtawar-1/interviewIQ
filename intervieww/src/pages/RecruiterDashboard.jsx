import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  LogOut,
  Users,
  Briefcase,
  BarChart2,
  FileText,
  Loader2,
  Search,
  Filter,
} from 'lucide-react';

const API = 'http://localhost:8000';

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [user, setUser] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadMeAndCandidates = useCallback(async () => {
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
    setError('');
    const meRes = await fetch(`${API}/api/auth/me`, { headers });
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

    const cRes = await fetch(`${API}/api/recruiter/candidates`, { headers });
    if (!cRes.ok) {
      const err = await cRes.json().catch(() => ({}));
      setError(err.detail || 'Could not load candidates.');
      setCandidates([]);
    } else {
      setCandidates(await cRes.json());
    }
    setLoading(false);
  }, [navigate, token]);

  useEffect(() => {
    if (!token) {
      navigate('/signin');
      return;
    }
    loadMeAndCandidates();
  }, [token, navigate, loadMeAndCandidates]);

  const allJobRoles = useMemo(() => {
    const s = new Set();
    candidates.forEach((c) => (c.job_roles || []).forEach((r) => s.add(r)));
    return [...s].sort();
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    let list = candidates;
    if (roleFilter !== 'all') {
      list = list.filter((c) => (c.job_roles || []).includes(roleFilter));
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          (c.full_name || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [candidates, roleFilter, searchQuery]);

  const sortedCandidateCards = useMemo(() => {
    return [...filteredCandidates].sort((a, b) => {
      const aHas = (a.completed_interview_count || 0) > 0 && a.average_score != null;
      const bHas = (b.completed_interview_count || 0) > 0 && b.average_score != null;
      if (aHas && bHas) return b.average_score - a.average_score;
      if (aHas && !bHas) return -1;
      if (!aHas && bHas) return 1;
      return (a.full_name || '').localeCompare(b.full_name || '', undefined, {
        sensitivity: 'base',
      });
    });
  }, [filteredCandidates]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/signin');
  };

  const completedCandidates = candidates.filter((c) => c.completed_interview_count > 0).length;
  const totalSessions = candidates.reduce((s, c) => s + (c.interview_count || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-sky-500/40 border-t-sky-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased scrollbar-refined">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.12),transparent)]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-sky-950/20 blur-3xl rounded-full translate-y-1/2" />
      </div>

      <nav className="relative border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-3.5 flex items-center justify-between gap-4">
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

      <div className="relative max-w-[1400px] mx-auto px-5 sm:px-8 py-8 sm:py-10">
        <header className="mb-8 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-500/90 mb-2">
            Talent intelligence
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            Recruiter workspace
          </h1>
          <p className="text-zinc-400 mt-2 text-base sm:text-lg max-w-2xl leading-relaxed">
            Open a candidate profile to see sessions, scores, and download the full interview report
            (.txt).
          </p>
        </header>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-950/40 border border-red-500/25 text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type="search"
              placeholder="Search by name or email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500/40 transition-shadow"
            />
          </div>
          <div className="flex items-center gap-2 lg:w-64">
            <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg py-2.5 px-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500/40"
            >
              <option value="all">All job roles</option>
              {allJobRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
        {(searchQuery || roleFilter !== 'all') && (
          <p className="text-sm text-zinc-500 mb-6">
            Showing {filteredCandidates.length} of {candidates.length} candidates
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <div className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-500/20 flex items-center justify-center mb-3">
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-semibold tabular-nums text-white">{candidates.length}</div>
            <div className="text-zinc-500 text-sm mt-0.5">Registered candidates</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-3">
              <BarChart2 className="w-4 h-4 text-zinc-300" />
            </div>
            <div className="text-2xl font-semibold tabular-nums text-white">{completedCandidates}</div>
            <div className="text-zinc-500 text-sm mt-0.5">With at least one completed interview</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
              <FileText className="w-4 h-4 text-emerald-400/90" />
            </div>
            <div className="text-2xl font-semibold tabular-nums text-white">{totalSessions}</div>
            <div className="text-zinc-500 text-sm mt-0.5">Total interview sessions</div>
          </div>
        </div>

        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-sky-500/90" />
          All candidates
        </h2>

        {sortedCandidateCards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 px-6 py-14 text-center text-zinc-500 text-sm leading-relaxed">
            {candidates.length === 0
              ? 'No candidates yet. They appear here after signing up as job seekers.'
              : 'No candidates match your filters.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {sortedCandidateCards.map((c) => (
              <Link
                key={c.id}
                to={`/recruiter/candidates/${c.id}`}
                className="text-left p-4 sm:p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-600 transition-all ring-0 hover:ring-1 hover:ring-sky-500/20 block group"
              >
                <div className="font-medium text-zinc-100 truncate text-sm group-hover:text-white">
                  {c.full_name}
                </div>
                <div className="text-xs text-zinc-500 truncate mt-0.5">{c.email}</div>
                <div className="text-2xl font-semibold tabular-nums text-sky-400 mt-2">
                  {c.average_score != null ? `${c.average_score}%` : '—'}
                  <span className="text-[10px] font-normal text-zinc-500 uppercase tracking-wider ml-1">
                    avg
                  </span>
                </div>
                <div className="text-xs text-zinc-500 mt-2">
                  {c.interview_count || 0} session(s) · {c.completed_interview_count || 0} completed
                </div>
                {(c.job_roles || []).length > 0 && (
                  <div className="text-xs text-zinc-500 mt-2 line-clamp-2">
                    {(c.job_roles || []).join(' · ')}
                  </div>
                )}
                <div className="text-xs text-sky-500/80 mt-3 font-medium">View profile →</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterDashboard;
