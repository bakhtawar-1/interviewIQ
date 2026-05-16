import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, LogOut, Users, Briefcase, BarChart2,
  FileText, Loader2, Search, Filter, Plus, Building2, User,
  Clock, CheckCircle, XCircle, ChevronRight, LayoutDashboard,
  Target, Activity, RefreshCw
} from 'lucide-react';

import { API_URL } from '../config';

const STATUS_MAP = {
  applied: { label: 'Applied', color: 'text-zinc-500 bg-zinc-800 border-zinc-700' },
  cv_passed: { label: 'CV Passed', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  cv_failed: { label: 'CV Failed', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  interview_pending: { label: 'Invited', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  interview_completed: { label: 'Ready for Review', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  pending_review: { label: 'Under Review', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  shortlisted: { label: 'Shortlisted', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  rejected: { label: 'Rejected', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
};

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [activeTab, setActiveTab] = useState('applications');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Me
      const meRes = await fetch(`${API_URL}/api/auth/me`, { headers });
      if (meRes.status === 401) { navigate('/signin'); return; }
      const meData = await meRes.json();
      setUser(meData);
      if (meData.role !== 'recruiter' && meData.role !== 'admin') { navigate('/dashboard'); return; }

      // 2. Applications
      const appRes = await fetch(`${API_URL}/api/recruiter/applications`, { headers });
      const appsData = await appRes.json();
      const appsArray = Array.isArray(appsData) ? appsData : [];
      setApplications(appsArray);
 
      // 3. Jobs
      const jobsRes = await fetch(`${API_URL}/api/recruiter/jobs`, { headers });
      const jobsData = await jobsRes.json();
      const jobsArray = Array.isArray(jobsData) ? jobsData : [];
      setJobs(jobsArray);
      
      // 4. Candidates
      const cRes = await fetch(`${API_URL}/api/recruiter/candidates`, { headers });
      const cData = await cRes.json();
      setCandidates(Array.isArray(cData) ? cData : []);

      // If no applications but we have jobs, switch to Jobs tab automatically
      if (appsArray.length === 0 && jobsArray.length > 0) {
        setActiveTab('jobs');
      }

    } catch (e) {
      setError('Failed to sync dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [navigate, headers]);

  useEffect(() => {
    if (!token) { navigate('/signin'); return; }
    fetchData();
  }, [token, fetchData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/signin');
  };

  // Stats calculation
  const stats = useMemo(() => ({
    totalApps: applications.length,
    pendingReview: applications.filter(a => a.status === 'interview_completed' || a.status === 'pending_review').length,
    activeJobs: jobs.filter(j => j.is_active).length,
    totalCandidates: candidates.length
  }), [applications, jobs, candidates]);

  // Filtering for active tab
  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (activeTab === 'applications') {
      return applications.filter(a =>
        (a.candidate_name || '').toLowerCase().includes(q) ||
        (a.job_title || '').toLowerCase().includes(q)
      );
    }
    if (activeTab === 'jobs') {
      return jobs.filter(j => (j.title || '').toLowerCase().includes(q));
    }
    if (activeTab === 'candidates') {
      return candidates.filter(c =>
        (c.full_name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      );
    }
    return [];
  }, [activeTab, applications, jobs, candidates, searchQuery]);

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-sky-500/40 border-t-sky-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.08),transparent)]" />
      </div>

      <nav className="relative border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 ring-1 ring-zinc-700/80 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-sky-400" />
            </div>
            <span className="text-lg font-semibold text-white">InterviewIQ</span>
          </Link>
          <div className="flex items-center gap-6">
            <button 
              onClick={fetchData} 
              className={`text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${loading ? 'opacity-50' : ''}`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync
            </button>
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Admin Panel</Link>
            )}
            <button onClick={handleLogout} className="text-sm text-zinc-400 hover:text-white flex items-center gap-2">
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="relative max-w-[1400px] mx-auto px-6 py-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Recruiter Dashboard</h1>
            <p className="text-zinc-400 mt-2 text-lg">Manage your jobs, screen candidates, and review AI interview reports.</p>
          </div>
          <Link
            to="/recruiter/post-job"
            className="px-6 py-3 bg-sky-600 hover:bg-sky-500 rounded-xl font-bold text-white flex items-center gap-2 transition-all shadow-lg shadow-sky-950/20 shrink-0"
          >
            <Plus className="w-5 h-5" /> Post a New Job
          </Link>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Applications', val: stats.totalApps, icon: Activity, color: 'text-sky-400' },
            { label: 'Ready for Review', val: stats.pendingReview, icon: Clock, color: 'text-amber-400' },
            { label: 'Active Jobs', val: stats.activeJobs, icon: Briefcase, color: 'text-purple-400' },
            { label: 'Talent Pool', val: stats.totalCandidates, icon: Users, color: 'text-emerald-400' },
          ].map((s, i) => (
            <div key={i} className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl">
              <s.icon className={`w-5 h-5 ${s.color} mb-4`} />
              <div className="text-3xl font-bold text-white tabular-nums">{s.val}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tab System */}
        <div className="flex items-center gap-1 bg-zinc-900/50 p-1 border border-zinc-800 rounded-xl mb-6 w-fit">
          {[
            { id: 'applications', label: 'Applications', icon: FileText, count: applications.length },
            { id: 'jobs', label: 'My Jobs', icon: Briefcase, count: jobs.length },
            { id: 'candidates', label: 'Talent Pool', icon: Users },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.id ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.count > 0 && <span className="bg-zinc-800 text-zinc-500 text-[10px] px-1.5 py-0.5 rounded-md border border-zinc-700">{t.count}</span>}
            </button>
          ))}
        </div>

        {/* Search & List */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-sky-500/50"
            />
          </div>

          <div className="space-y-3">
            {filteredData.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-zinc-800 rounded-3xl">
                <p className="text-zinc-600">No {activeTab} found matching your criteria.</p>
              </div>
            ) : (
              activeTab === 'applications' ? (
                <div className="grid grid-cols-1 gap-3">
                  {filteredData.map(app => (
                    <Link
                      key={app.id}
                      to={`/recruiter/applications/${app.id}`}
                      className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:bg-zinc-900/60 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white">{app.candidate_name}</h3>
                          <p className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                            <Briefcase className="w-3 h-3" /> {app.job_title}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="hidden sm:block text-right">
                          <div className={`text-lg font-bold tabular-nums ${app.cv_match_score >= 65 ? 'text-emerald-400' : 'text-red-400'}`}>{app.cv_match_score?.toFixed(0)}%</div>
                          <div className="text-[10px] text-zinc-500 uppercase font-bold">Match</div>
                        </div>
                        <div className="hidden md:block text-right">
                          <div className="text-lg font-bold text-white tabular-nums">{app.interview_overall_score != null ? `${Math.round(app.interview_overall_score)}%` : '—'}</div>
                          <div className="text-[10px] text-zinc-500 uppercase font-bold">Interview</div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_MAP[app.status]?.color || ''}`}>
                          {STATUS_MAP[app.status]?.label || app.status}
                        </span>
                        <ChevronRight className="w-5 h-5 text-zinc-700 group-hover:text-white transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : activeTab === 'jobs' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredData.map(job => (
                    <div key={job.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-bold text-lg text-white leading-tight">{job.title}</h3>
                        {job.is_active ? <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">LIVE</span> : <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-md">CLOSED</span>}
                      </div>
                      <div className="space-y-2 mb-6">
                        <p className="text-xs text-zinc-500 line-clamp-2">{job.description}</p>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest pt-2">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {job.application_count || 0} Apps</span>
                          <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {job.cv_match_threshold}% Min</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/recruiter/jobs/${job.id}`} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-white text-center transition-colors">Manage</Link>
                        <Link to={`/recruiter/jobs/${job.id}/applications`} className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 rounded-xl text-xs font-bold text-white text-center transition-colors">Applications</Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Talent Pool / Candidates
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredData.map(c => (
                    <Link key={c.id} to={`/recruiter/candidates/${c.id}`} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:border-sky-500/30 transition-all">
                      <div className="font-bold text-white mb-1 truncate">{c.full_name}</div>
                      <div className="text-[10px] text-zinc-500 mb-4 truncate">{c.email}</div>
                      <div className="text-2xl font-bold text-sky-400">{c.average_score != null ? `${Math.round(c.average_score)}%` : '—'}</div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold">Avg Performance</div>
                    </Link>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
