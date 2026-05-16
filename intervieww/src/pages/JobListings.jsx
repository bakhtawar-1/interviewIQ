import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, Search, Filter, Briefcase, Clock, Target,
  ChevronRight, ArrowRight, GraduationCap
} from 'lucide-react';

const API = 'http://localhost:8000';

const JobListings = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [applyingId, setApplyingId] = useState(null);
  const [applyResults, setApplyResults] = useState({}); // jobId → {score, passed, message}
  const [previewScores, setPreviewScores] = useState({}); // jobId → score
  const [selectedJob, setSelectedJob] = useState(null); // For detail modal
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchPreview = useCallback(async (jobId) => {
    try {
      const res = await fetch(`${API}/api/jobs/${jobId}/cv-preview`, { headers });
      if (res.ok) {
        const d = await res.json();
        setPreviewScores(prev => ({ ...prev, [jobId]: d }));
      }
    } catch {}
  }, [headers]);

  const fetchJobs = useCallback(async () => {
    try {
      const meRes = await fetch(`${API}/api/auth/me`, { headers });
      if (meRes.ok) setUser(await meRes.json());

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (skillFilter) params.append('skill', skillFilter);
      const res = await fetch(`${API}/api/jobs?${params}`, { headers });
      const data = await res.json();
      const jobList = Array.isArray(data) ? data : [];
      setJobs(jobList);
      // Auto-preview CV match scores
      jobList.forEach(job => fetchPreview(job.id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, skillFilter, headers, fetchPreview]);

  useEffect(() => {
    if (!token) { navigate('/signin'); return; }
    fetchJobs();
  }, [fetchJobs, navigate, token]);

  const handleCVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API}/api/candidate/upload-cv`, { method: 'POST', headers, body: fd });
      if (res.ok) {
        await fetchJobs(); // Refresh user data and scores
      }
    } catch {} finally { setUploading(false); }
  };

  const handleApply = async (jobId) => {
    if (!user?.skills && !user?.experience) {
      setApplyResults(prev => ({ ...prev, [jobId]: { error: 'Please upload your CV in Profile before applying.' } }));
      return;
    }
    setApplyingId(jobId);
    try {
      const res = await fetch(`${API}/api/candidate/apply/${jobId}`, {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.detail?.toLowerCase().includes('already applied')) {
          // If we already applied, just sync the state and don't show it as a "failure"
          setApplyResults(prev => ({ ...prev, [jobId]: null }));
          fetchJobs();
        } else {
          setApplyResults(prev => ({ ...prev, [jobId]: { error: data.detail || 'Application failed.' } }));
        }
      } else {
        // Success: Update the local jobs state immediately so the UI reflects the new status
        setJobs(prevJobs => prevJobs.map(j => 
          j.id === jobId ? { ...j, application_status: data.status, match_score: data.cv_match_score } : j
        ));
        
        setApplyResults(prev => ({
          ...prev,
          [jobId]: {
            status: data.status,
            score: data.cv_match_score,
            passed: data.status === 'interview_pending',
          }
        }));
      }
    } catch (err) {
      console.error('Apply Error:', err);
      setApplyResults(prev => ({ 
        ...prev, 
        [jobId]: { error: 'Network or Server error. If this happens twice, please refresh.' } 
      }));
    } finally {
      setApplyingId(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchJobs();
  };

  const scoreColor = (score) => {
    if (score == null) return 'text-zinc-500';
    if (score >= 75) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const scoreBg = (score) => {
    if (score == null) return 'bg-zinc-800 border-zinc-700';
    if (score >= 75) return 'bg-emerald-500/10 border-emerald-500/30';
    if (score >= 50) return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  const formatDeadline = (d) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-sky-500/40 border-t-sky-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.08),transparent)]" />
      </div>

      <nav className="relative border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 ring-1 ring-zinc-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-sky-400" />
            </div>
            <span className="text-lg font-semibold text-white">InterviewIQ</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Dashboard</Link>
            <Link to="/applications" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">My Applications</Link>
            <Link to="/profile" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors font-medium">Profile</Link>
          </div>
        </div>
      </nav>

      <div className="relative max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Job Listings</h1>
          <p className="text-zinc-400 mt-1">Browse open positions and see your CV match before applying.</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search jobs by title or keyword…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500/40 transition-shadow"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Skill filter…"
              value={skillFilter}
              onChange={e => setSkillFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500/40 transition-shadow w-36"
            />
          </div>
          <button type="submit" className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 rounded-xl text-sm font-semibold text-white transition-colors">
            Search
          </button>
        </form>

        {/* Job cards */}
        {jobs.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No jobs found. Try adjusting your search.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => {
              const preview = previewScores[job.id];
              const result = applyResults[job.id];
              const score = job.match_score ?? preview?.score;
              const threshold = preview?.threshold ?? job.cv_match_threshold;
              
              const status = job.application_status;
              const isApplied = !!status;
              const isInterviewPending = status === 'interview_pending';
              const isRejected = status === 'rejected' || status === 'cv_failed';

              return (
                <div key={job.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-600 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-white font-semibold text-lg truncate">{job.title}</h2>
                        {job.is_active && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0">
                            Open
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-400 text-sm line-clamp-2 mb-3">{job.description}</p>

                      <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                        {job.required_experience && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" /> {job.required_experience}
                          </span>
                        )}
                        {job.required_education && (
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" /> {job.required_education}
                          </span>
                        )}
                        {job.deadline && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Deadline: {formatDeadline(job.deadline)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" /> {job.total_questions} questions · {job.time_limit_minutes} min
                        </span>
                      </div>

                      {job.required_skills && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {job.required_skills.split(',').map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-400">
                              {s.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* CV Match Score */}
                    <div className="shrink-0 text-right">
                      {score != null ? (
                        <div className={`border rounded-xl px-4 py-3 ${scoreBg(score)}`}>
                          <div className={`text-2xl font-bold tabular-nums ${scoreColor(score)}`}>{score}%</div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">CV Match</div>
                          <div className={`text-[10px] mt-1 font-bold ${preview?.will_pass ? 'text-emerald-400' : 'text-red-400'}`}>
                            {preview?.will_pass ? '✓ Above threshold' : 
                             (preview?.experience_passed === false || preview?.education_passed === false) ? '✗ Requirements Not Met' :
                             `✗ Need ${threshold}%`}
                          </div>
                        </div>
                      ) : (
                        <div className="border border-zinc-700 bg-zinc-800 rounded-xl px-4 py-3 text-center">
                          <div className="text-zinc-500 text-xs">Upload CV</div>
                          <div className="text-zinc-600 text-[10px] mt-0.5">to see match</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Apply row */}
                  <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between gap-4">
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="text-sm font-bold text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1 group"
                    >
                      View details 
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {result?.error ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-red-400 text-[11px] font-bold bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20">
                          {result.error}
                        </span>
                        {result.error.includes('upload your CV') && (
                          <label className="cursor-pointer px-3 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-[10px] font-bold text-sky-400 transition-colors mt-1">
                            {uploading ? 'Uploading...' : 'Quick Upload CV'}
                            <input type="file" className="hidden" onChange={handleCVUpload} accept=".pdf,.docx,.txt" />
                          </label>
                        )}
                        {!isApplied && !result.error.includes('already') && (
                          <button 
                            onClick={() => { setApplyResults(prev => ({ ...prev, [job.id]: null })); handleApply(job.id); }}
                            className="text-[10px] text-zinc-500 hover:text-zinc-300 underline mt-1"
                          >
                            Retry Application
                          </button>
                        )}
                      </div>
                    ) : isInterviewPending ? (
                      <button
                        onClick={() => navigate('/interview/new', { state: { jobTitle: job.title, jobId: job.id, questionCount: job.total_questions, timeLimitMinutes: job.time_limit_minutes } })}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-black text-white transition-all shadow-xl shadow-emerald-500/20 active:scale-95 animate-pulse-glow"
                      >
                        Start AI Interview <Sparkles className="w-4 h-4" />
                      </button>
                    ) : isApplied ? (
                      <div className="text-right">
                        <div className={`text-sm font-bold flex items-center justify-end gap-2 ${
                          isRejected ? 'text-red-400' : 
                          status === 'shortlisted' ? 'text-emerald-400' : 
                          'text-sky-400'
                        }`}>
                          {status === 'cv_failed' ? (
                            <>
                              <span className="w-2 h-2 bg-red-500 rounded-full" />
                              CV Match Failed
                            </>
                          ) : status === 'rejected' ? (
                            <>
                              <span className="w-2 h-2 bg-red-500 rounded-full" />
                              Application Rejected
                            </>
                          ) : job.interview_status === 'disqualified' ? (
                            <>
                              <div className="w-2 h-2 bg-red-500 rounded-full" />
                              Disqualified
                            </>
                          ) : status === 'interview_completed' ? (
                            <>
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                              Interview Finished
                            </>
                          ) : status === 'pending_review' ? (
                            <>
                              <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
                              Pending Review
                            </>
                          ) : status === 'shortlisted' ? (
                            <>
                              <Sparkles className="w-4 h-4 text-emerald-400" />
                              Shortlisted
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
                              Application Submitted
                            </>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mt-1 opacity-60">
                          {status.replace('_', ' ')}
                        </p>
                      </div>

                    ) : (
                      <button
                        onClick={() => handleApply(job.id)}
                        disabled={applyingId === job.id}
                        className="flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 rounded-xl text-sm font-semibold text-white transition-colors"
                      >
                        {applyingId === job.id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>Apply Now <ArrowRight className="w-3.5 h-3.5" /></>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
 
      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedJob.title}</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">Active</span>
                    <span className="text-zinc-500 text-sm">{selectedJob.total_questions} Questions · {selectedJob.time_limit_minutes} Min</span>
                  </div>
                </div>
                <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all">✕</button>
              </div>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-3">Job Description</h3>
                  <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-sm">{selectedJob.description}</div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-3">Requirements</h3>
                    <div className="space-y-2 text-sm text-zinc-300">
                       {selectedJob.required_experience && <p>• {selectedJob.required_experience} exp</p>}
                       {selectedJob.required_education && <p>• {selectedJob.required_education}</p>}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-3">Target Skills</h3>
                    <div className="flex flex-wrap gap-2">
                       {selectedJob.required_skills?.split(',').map((s, i) => (
                         <span key={i} className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300">{s.trim()}</span>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-zinc-950/50 border-t border-zinc-800 flex justify-end gap-4">
              <button onClick={() => setSelectedJob(null)} className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-semibold text-white transition-colors">Close</button>
              {(() => {
                const status = selectedJob.application_status;
                const isApplied = !!status;
                const isInterviewPending = status === 'interview_pending';

                if (isInterviewPending) return (
                  <button 
                    onClick={() => { navigate('/interview/new', { state: { jobTitle: selectedJob.title, jobId: selectedJob.id, questionCount: selectedJob.total_questions, timeLimitMinutes: selectedJob.time_limit_minutes } }); setSelectedJob(null); }} 
                    className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-bold text-white transition-colors flex items-center gap-2"
                  >
                    Start AI Interview <Sparkles className="w-3.5 h-3.5" />
                  </button>
                );

                if (isApplied) return (
                  <div className="px-6 py-2.5 bg-zinc-800 rounded-xl text-sm font-bold text-zinc-400">
                    {selectedJob.interview_status === 'disqualified' ? 'DISQUALIFIED' : status.toUpperCase().replace('_', ' ')}
                  </div>
                );

                return (
                  <button 
                    onClick={() => { handleApply(selectedJob.id); setSelectedJob(null); }} 
                    className="px-8 py-2.5 bg-sky-600 hover:bg-sky-500 rounded-xl text-sm font-semibold text-white transition-colors"
                  >
                    Apply for this Position
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobListings;
