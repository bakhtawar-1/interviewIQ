import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, CheckCircle, XCircle, Clock, Briefcase, Play, ChevronRight, AlertCircle, FileText } from 'lucide-react';

import { API_URL } from '../config';

const STATUS_CONFIG = {
  applied:             { label: 'Applied',            color: 'text-zinc-400 bg-zinc-800 border-zinc-700' },
  cv_failed:           { label: 'CV Not Matched',     color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  cv_passed:           { label: 'CV Passed',          color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  interview_pending:   { label: 'Interview Ready',    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  interview_completed: { label: 'Interview Done',     color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  pending_review:      { label: 'Under Review',       color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  shortlisted:         { label: '🎉 Shortlisted',     color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  rejected:            { label: 'Not Selected',       color: 'text-red-400 bg-red-500/10 border-red-500/30' },
};

const ApplicationStatus = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { navigate('/signin'); return; }
    fetch(`${API_URL}/api/candidate/applications`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.status === 401 ? navigate('/signin') : r.json())
      .then(d => setApplications(Array.isArray(d) ? d : []))
      .catch(() => setError('Failed to load applications.'))
      .finally(() => setLoading(false));
  }, []);

  const fmt = d => d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="w-10 h-10 border-2 border-sky-500/40 border-t-sky-400 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="fixed inset-0 pointer-events-none"><div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.08),transparent)]" /></div>
      <nav className="relative border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors text-sm"><ArrowLeft className="w-4 h-4" /> Dashboard</Link>
          <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-zinc-900 ring-1 ring-zinc-700 flex items-center justify-center"><Sparkles className="w-3 h-3 text-sky-400" /></div><span className="font-semibold text-white">InterviewIQ</span></div>
          <div className="flex items-center gap-4">
            <Link to="/profile" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors font-medium">Profile</Link>
          </div>
        </div>
      </nav>
      <div className="relative max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8"><h1 className="text-3xl font-bold text-white">My Applications</h1><p className="text-zinc-400 mt-1">Track all your job applications and interview progress.</p></div>
        {error && <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
        {applications.length === 0 ? (
          <div className="text-center py-20"><Briefcase className="w-12 h-12 mx-auto mb-4 text-zinc-700" /><p className="text-zinc-500 text-lg">No applications yet.</p><Link to="/jobs" className="mt-4 inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 text-sm font-medium">Browse jobs <ChevronRight className="w-4 h-4" /></Link></div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => {
              const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied;
              return (
                <div key={app.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-white font-semibold text-lg">{app.job_title || `Job #${app.job_id}`}</h2>
                      {app.company_name && <p className="text-zinc-500 text-sm mt-0.5">{app.company_name}</p>}
                      <p className="text-zinc-600 text-xs mt-1">Applied {fmt(app.created_at)}</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${app.interview_status === 'disqualified' ? 'text-red-400 bg-red-500/10 border-red-500/30' : cfg.color} shrink-0`}>
                      {app.interview_status === 'disqualified' ? 'Disqualified' : cfg.label}
                    </span>
                  </div>
                  <div className="flex gap-3 mb-4 flex-wrap">
                    <div className="bg-zinc-800/50 rounded-xl px-4 py-2 text-center">
                      <div className="text-lg font-bold text-sky-400">{app.cv_match_score != null ? `${app.cv_match_score.toFixed(1)}%` : '—'}</div>
                      <div className="text-zinc-500 text-xs">CV Match</div>
                    </div>
                    {app.recruiter_override_score != null && (
                      <div className="bg-zinc-800/50 rounded-xl px-4 py-2 text-center">
                        <div className="text-lg font-bold text-purple-400">{Math.round(app.recruiter_override_score)}%</div>
                        <div className="text-zinc-500 text-xs">Recruiter Score</div>
                      </div>
                    )}
                  </div>
                  {app.status === 'shortlisted' && <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm mb-4">🎉 Congratulations! You have been shortlisted. The recruiter will be in touch with next steps.</div>}
                  {app.interview_status === 'disqualified' && <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm mb-4"><p className="font-medium mb-1">Interview Disqualified</p><p className="text-red-400/80 text-xs">This application was rejected due to multiple proctoring violations detected during your AI interview.</p></div>}
                  {(app.status === 'rejected' || app.status === 'cv_failed') && app.rejection_reason && app.interview_status !== 'disqualified' && <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm mb-4"><p className="font-medium mb-1">{app.status === 'cv_failed' ? 'CV did not meet threshold.' : 'Not selected for this role.'}</p><p className="text-red-400/80 text-xs">{app.rejection_reason}</p></div>}
                  {app.status === 'interview_pending' && (
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                      <p className="text-amber-400 text-sm font-medium">Your interview is ready!</p>
                      <Link to="/interview/video" className="flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-500 rounded-xl text-sm font-semibold text-white transition-colors"><Play className="w-4 h-4" /> Start Interview</Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationStatus;
