import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowLeft, User, Mail, Briefcase, Target,
  CheckCircle, XCircle, MessageSquare, Save, AlertCircle, Clock,
  FileText, TrendingUp, Shield, BarChart3, Download
} from 'lucide-react';

import { API_URL } from '../config';

const RecruiterApplicationReview = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const [application, setApplication] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [reviewForm, setReviewForm] = useState({
    recruiter_override_score: '',
    recruiter_notes: '',
    decision: '', // 'shortlist' or 'reject'
    rejection_reason: ''
  });

  useEffect(() => {
    if (!token) { navigate('/signin'); return; }
    fetchData();
  }, [applicationId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const appRes = await fetch(`${API_URL}/api/recruiter/applications/${applicationId}`, { headers });
      if (!appRes.ok) throw new Error('Failed to load application');
      const appData = await appRes.json();
      setApplication(appData);

      setReviewForm({
        recruiter_override_score: appData.recruiter_override_score || '',
        recruiter_notes: appData.recruiter_notes || '',
        decision: appData.status === 'shortlisted' ? 'shortlist' : appData.status === 'rejected' ? 'reject' : '',
        rejection_reason: appData.rejection_reason || ''
      });

      if (appData.interview_id) {
        const reportRes = await fetch(`${API_URL}/api/recruiter/applications/${applicationId}/interview-report`, { headers });
        if (reportRes.ok) {
          setReport(await reportRes.json());
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (decision) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/recruiter/applications/${applicationId}/review`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reviewForm,
          decision,
          recruiter_override_score: reviewForm.recruiter_override_score ? Number(reviewForm.recruiter_override_score) : null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to submit review');
      setSuccess(`Application ${decision}ed successfully!`);
      fetchData();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadReport = () => {
    if (!application || !report) return;

    let content = `INTERVIEW IQ - CANDIDATE REPORT\n`;
    content += `===============================\n\n`;
    content += `Candidate: ${application.candidate_name} (${application.candidate_email})\n`;
    content += `Role: ${application.job_title}\n`;
    content += `CV Match Score: ${application.cv_match_score?.toFixed(1)}%\n\n`;
    
    content += `AI INTERVIEW SUMMARY\n`;
    content += `---------------------\n`;
    content += `Technical Score: ${report.summary?.technical_score || 0}%\n`;
    content += `Communication Score: ${report.summary?.communication_score || 0}%\n`;
    content += `Confidence Score: ${report.summary?.confidence_score || 0}%\n\n`;
    
    content += `Strengths:\n${report.summary?.strengths || 'N/A'}\n\n`;
    content += `Weaknesses:\n${report.summary?.weaknesses || 'N/A'}\n\n`;
    
    content += `INTERVIEW RESPONSES\n`;
    content += `-------------------\n`;
    
    report.questions_and_answers?.forEach((qa, i) => {
      content += `\nQ${i+1}: ${qa.question}\n`;
      content += `Score: ${qa.score}%\n`;
      content += `Answer: "${qa.answer}"\n`;
      content += `Feedback: ${qa.feedback}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${application.candidate_name.replace(/\\s+/g, '_')}_Interview_Report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-sky-500/40 border-t-sky-400 rounded-full animate-spin" />
    </div>
  );

  if (!application) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400">
      <p>Application not found.</p>
      <Link to="/recruiter" className="text-sky-400 mt-4 underline">Back to Dashboard</Link>
    </div>
  );

  const cvBreakdown = application.cv_match_breakdown ? JSON.parse(application.cv_match_breakdown) : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.08),transparent)]" />
      </div>

      <nav className="relative border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={application ? `/recruiter/jobs/${application.job_id}/applications` : "/recruiter"} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Applications
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 ring-1 ring-zinc-700 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-sky-400" />
            </div>
            <span className="font-semibold text-white">InterviewIQ Review</span>
          </div>
        </div>
      </nav>

      <div className="relative max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Candidate & CV Info */}
        <div className="lg:col-span-2 space-y-6">
          <header className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">{application.candidate_name}</h1>
                <p className="text-zinc-400 flex items-center gap-1.5 mt-1">
                  <Mail className="w-3.5 h-3.5" /> {application.candidate_email}
                </p>
                <p className="text-sky-400 font-medium mt-3 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" /> {application.job_title}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold tabular-nums ${application.cv_match_score >= 65 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {application.cv_match_score?.toFixed(1)}%
                </div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">CV Match Score</div>
              </div>
            </div>
          </header>
          {application.interview_status === 'disqualified' && (
            <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-6 flex items-start gap-4">
              <Shield className="w-8 h-8 text-red-400 shrink-0" />
              <div>
                <h3 className="text-red-400 font-bold text-lg">Candidate Disqualified</h3>
                <p className="text-red-300/80 text-sm mt-1">
                  The AI proctoring system terminated this interview due to multiple violations (tab switching, eyes off screen, or face not visible). 
                  This candidate has been automatically moved to the rejected list.
                </p>
              </div>
            </div>
          )}

          {cvBreakdown && (
            <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-sky-400" /> CV Screening Results
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Matched Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {cvBreakdown.matched_skills?.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-full">
                        {s}
                      </span>
                    )) || <span className="text-zinc-600 italic text-xs">None detected</span>}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Missing Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {cvBreakdown.missing_skills?.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-full">
                        {s}
                      </span>
                    )) || <span className="text-zinc-600 italic text-xs">None</span>}
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="text-sm">
                    <span className="text-zinc-500">Experience:</span>
                    <p className="text-zinc-300 mt-1">{cvBreakdown.experience_notes || 'N/A'}</p>
                 </div>
                 <div className="text-sm">
                    <span className="text-zinc-500">Education:</span>
                    <p className="text-zinc-300 mt-1">{cvBreakdown.education_notes || 'N/A'}</p>
                 </div>
              </div>
            </section>
          )}

          {/* Interview Report */}
          {report ? (
            <section className="space-y-6">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-400" /> AI Interview Summary
                  </h2>
                  <button 
                    onClick={handleDownloadReport}
                    className="flex items-center gap-2 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Report
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-zinc-800/40 p-4 rounded-xl text-center border border-zinc-700/50">
                    <div className="text-2xl font-bold text-sky-400">{report.summary?.technical_score || 0}%</div>
                    <div className="text-[10px] text-zinc-500 uppercase mt-1">Technical</div>
                  </div>
                  <div className="bg-zinc-800/40 p-4 rounded-xl text-center border border-zinc-700/50">
                    <div className="text-2xl font-bold text-emerald-400">{report.summary?.communication_score || 0}%</div>
                    <div className="text-[10px] text-zinc-500 uppercase mt-1">Communication</div>
                  </div>
                  <div className="bg-zinc-800/40 p-4 rounded-xl text-center border border-zinc-700/50">
                    <div className="text-2xl font-bold text-amber-400">{report.summary?.confidence_score || 0}%</div>
                    <div className="text-[10px] text-zinc-500 uppercase mt-1">Confidence</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2">Strengths</h4>
                    <p className="text-zinc-300 text-sm">{report.summary?.strengths || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Weaknesses</h4>
                    <p className="text-zinc-300 text-sm">{report.summary?.weaknesses || 'N/A'}</p>
                  </div>
                </div>

                {report.summary?.report_json && (() => {
                  try {
                    const data = JSON.parse(report.summary.report_json);
                    const violations = data.proctoring_violations || [];
                    if (violations.length === 0) return null;
                    return (
                      <div className="mt-6 pt-6 border-t border-zinc-800">
                        <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5" /> Proctoring Violation Log
                        </h4>
                        <div className="space-y-1.5">
                          {violations.map((v, idx) => (
                            <div key={idx} className="text-xs text-zinc-400 flex gap-2">
                              <span className="text-red-500/60 font-bold">#{idx + 1}</span> {v}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  } catch { return null; }
                })()}
              </div>

              {/* Q&A List */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-2">Interview Responses</h3>
                {report.questions_and_answers?.map((qa, i) => (
                  <div key={i} className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <p className="text-white font-medium text-sm">Q{i+1}: {qa.question}</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${qa.score >= 70 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {qa.score}%
                      </span>
                    </div>
                    <div className="bg-zinc-950/50 rounded-lg p-3 text-sm text-zinc-400 italic mb-3 border border-zinc-800">
                      "{qa.answer}"
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      <span className="font-bold text-zinc-400">AI Feedback:</span> {qa.feedback}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : application.status === 'interview_pending' ? (
            <div className="bg-zinc-900/60 border border-zinc-800 border-dashed rounded-2xl p-12 text-center text-zinc-500">
              <Clock className="w-10 h-10 mx-auto mb-4 opacity-20" />
              <p>Interview not yet taken by the candidate.</p>
            </div>
          ) : null}
        </div>

        {/* Right Column: Recruiter Review Panel */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-24 shadow-2xl shadow-sky-950/10">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-sky-400" /> Recruiter Decision
            </h2>

            {success && <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs">{success}</div>}
            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">{error}</div>}

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Override Score (0-100)</label>
                <input
                  type="number"
                  value={reviewForm.recruiter_override_score}
                  onChange={e => setReviewForm(f => ({ ...f, recruiter_override_score: e.target.value }))}
                  placeholder="e.g. 85"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-sky-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Private Notes</label>
                <textarea
                  value={reviewForm.recruiter_notes}
                  onChange={e => setReviewForm(f => ({ ...f, recruiter_notes: e.target.value }))}
                  placeholder="Only visible to recruiters..."
                  rows={4}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-sky-500 text-sm resize-none"
                />
              </div>

              <div className="pt-4 space-y-3">
                <button
                  onClick={() => handleReview('shortlist')}
                  disabled={saving}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/20"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Shortlist Candidate
                </button>
                <button
                  onClick={() => handleReview('reject')}
                  disabled={saving}
                  className="w-full py-3 bg-zinc-800 hover:bg-red-900/40 hover:text-red-400 hover:border-red-900/50 border border-transparent disabled:opacity-50 rounded-xl font-bold text-zinc-400 flex items-center justify-center gap-2 transition-all"
                >
                  <XCircle className="w-4 h-4" /> Reject Application
                </button>
              </div>

              {reviewForm.decision === 'reject' && (
                <div className="pt-4 border-t border-zinc-800">
                  <label className="block text-xs font-bold text-red-500/70 uppercase mb-2">Rejection Feedback (Shared with Candidate)</label>
                  <textarea
                    value={reviewForm.rejection_reason}
                    onChange={e => setReviewForm(f => ({ ...f, rejection_reason: e.target.value }))}
                    placeholder="Provide feedback on why they weren't selected..."
                    rows={3}
                    className="w-full bg-zinc-950 border border-red-900/20 rounded-xl py-2 px-3 text-zinc-300 text-xs focus:outline-none focus:border-red-500/40"
                  />
                  <p className="text-[10px] text-zinc-600 mt-2 italic">Candidate will be notified via email when you click 'Reject'.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterApplicationReview;
