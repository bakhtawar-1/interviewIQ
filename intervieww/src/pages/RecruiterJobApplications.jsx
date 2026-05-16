import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowLeft, Users, Target, Search, Filter,
  ChevronRight, FileText, Activity, Trophy, BarChart3,
  CheckCircle, XCircle, Clock, ExternalLink, Download,
  TrendingUp, Star
} from 'lucide-react';

const API = 'http://localhost:8000';

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

const RecruiterJobApplications = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!token) { navigate('/signin'); return; }
    fetchData();
  }, [jobId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Job
      const jobRes = await fetch(`${API}/api/recruiter/jobs/${jobId}`, { headers });
      if (!jobRes.ok) throw new Error('Job not found');
      const jobData = await jobRes.json();
      setJob(jobData);

      // 2. Fetch Applications for this job
      const appsRes = await fetch(`${API}/api/recruiter/applications?job_id=${jobId}`, { headers });
      if (!appsRes.ok) throw new Error('Failed to load applications');
      const appsData = await appsRes.json();
      
      // Sort by ranking (Overall Score desc, then CV Score desc)
      const sortedApps = appsData.sort((a, b) => {
        const scoreA = a.interview_overall_score || 0;
        const scoreB = b.interview_overall_score || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return (b.cv_match_score || 0) - (a.cv_match_score || 0);
      });

      setApplications(sortedApps);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch = 
        (app.candidate_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.candidate_email || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: applications.length,
      shortlisted: applications.filter(a => a.status === 'shortlisted').length,
      avgScore: applications.filter(a => a.interview_overall_score != null)
        .reduce((acc, a, _, arr) => acc + (a.interview_overall_score / arr.length), 0)
    };
  }, [applications]);

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-sky-500/40 border-t-sky-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.08),transparent)]" />
      </div>

      <nav className="relative border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/recruiter" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 ring-1 ring-zinc-700/80 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-sky-400" />
            </div>
            <span className="font-semibold text-white">Application Manager</span>
          </div>
        </div>
      </nav>

      <div className="relative max-w-[1400px] mx-auto px-6 py-10">
        {/* Header Section */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <span className="text-xs font-bold text-sky-400 uppercase tracking-widest px-2 py-0.5 bg-sky-500/10 border border-sky-500/20 rounded">Ranked Candidates</span>
               <span className="text-zinc-500 text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Updated just now</span>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">{job?.title}</h1>
            <p className="text-zinc-400 mt-2 flex items-center gap-2">
              <Users className="w-4 h-4" /> {applications.length} total applications for this role
            </p>
          </div>
          
          <div className="flex gap-4">
             <div className="bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded-xl">
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Avg. Interview</div>
                <div className="text-xl font-bold text-white">{Math.round(stats.avgScore)}%</div>
             </div>
             <div className="bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded-xl">
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Shortlisted</div>
                <div className="text-xl font-bold text-emerald-400">{stats.shortlisted}</div>
             </div>
          </div>
        </header>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-sky-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
             <Filter className="w-4 h-4 text-zinc-500" />
             <select 
               value={statusFilter}
               onChange={e => setStatusFilter(e.target.value)}
               className="bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-sky-500/50 text-zinc-300"
             >
                <option value="all">All Statuses</option>
                <option value="interview_completed">Ready for Review</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="pending_review">Under Review</option>
                <option value="cv_passed">CV Passed</option>
                <option value="rejected">Rejected</option>
             </select>
          </div>
        </div>

        {/* Ranked Table */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60">
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Rank</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Candidate</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">CV Match</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Technical</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Comm.</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Conf.</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Overall</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredApps.map((app, index) => (
                  <tr key={app.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2">
                          {index === 0 && <Trophy className="w-4 h-4 text-amber-400" />}
                          {index === 1 && <Trophy className="w-4 h-4 text-zinc-400" />}
                          {index === 2 && <Trophy className="w-4 h-4 text-amber-600" />}
                          <span className={`font-bold tabular-nums ${index < 3 ? 'text-white' : 'text-zinc-600'}`}>#{index + 1}</span>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <div className="font-bold text-white group-hover:text-sky-400 transition-colors">{app.candidate_name}</div>
                        <div className="text-xs text-zinc-500">{app.candidate_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className={`text-sm font-bold ${app.cv_match_score >= 80 ? 'text-emerald-400' : app.cv_match_score >= 60 ? 'text-sky-400' : 'text-zinc-400'}`}>
                        {app.cv_match_score?.toFixed(0)}%
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="text-sm font-medium text-zinc-300">
                        {app.technical_score != null ? `${Math.round(app.technical_score)}%` : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="text-sm font-medium text-zinc-300">
                        {app.communication_score != null ? `${Math.round(app.communication_score)}%` : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="text-sm font-medium text-zinc-300">
                        {app.confidence_score != null ? `${Math.round(app.confidence_score)}%` : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className={`text-lg font-bold tabular-nums ${app.interview_overall_score >= 75 ? 'text-emerald-400' : app.interview_overall_score >= 50 ? 'text-amber-400' : 'text-zinc-400'}`}>
                        {app.interview_overall_score != null ? `${Math.round(app.interview_overall_score)}%` : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_MAP[app.status]?.color || ''}`}>
                        {STATUS_MAP[app.status]?.label || app.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link 
                        to={`/recruiter/applications/${app.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-sky-600 rounded-lg text-xs font-bold text-white transition-all"
                      >
                        Review <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredApps.length === 0 && (
              <div className="py-20 text-center">
                <Users className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                <p className="text-zinc-600">No candidates found matching the criteria.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Help Tip */}
        <div className="mt-8 p-6 bg-sky-500/5 border border-sky-500/10 rounded-2xl flex items-start gap-4">
           <Activity className="w-6 h-6 text-sky-400 shrink-0" />
           <div>
              <h4 className="font-bold text-white text-sm">How ranking works</h4>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Candidates are automatically ranked based on their AI Interview Overall Score. 
                If scores are identical, the CV Match Score is used as a tie-breaker. 
                Technical, Communication, and Confidence scores are derived from the AI analysis of their responses.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterJobApplications;
