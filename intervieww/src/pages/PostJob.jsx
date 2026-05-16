import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, ArrowRight, Plus, Trash2, CheckCircle } from 'lucide-react';

import { API_URL } from '../config';

const STEPS = ['Job Details', 'Interview Settings', 'Custom Questions', 'Review & Post'];

const PostJob = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [postedJob, setPostedJob] = useState(null);

  const [form, setForm] = useState({
    title: '', description: '', required_skills: '',
    required_experience: '', required_education: '',
    cv_match_threshold: 65, total_questions: 10,
    ai_question_ratio: 0.7, time_limit_minutes: 30,
    passing_score: 60, deadline: '',
  });

  const [customQuestions, setCustomQuestions] = useState([]);
  const [newQ, setNewQ] = useState({ question_text: '', difficulty: 'medium', expected_keywords: '' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addQuestion = () => {
    if (!newQ.question_text.trim()) return;
    setCustomQuestions(qs => [...qs, { ...newQ }]);
    setNewQ({ question_text: '', difficulty: 'medium', expected_keywords: '' });
  };

  const removeQuestion = (i) => setCustomQuestions(qs => qs.filter((_, idx) => idx !== i));

  const handlePost = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = { ...form, cv_match_threshold: Number(form.cv_match_threshold), total_questions: Number(form.total_questions), ai_question_ratio: Number(form.ai_question_ratio), time_limit_minutes: Number(form.time_limit_minutes), passing_score: Number(form.passing_score), deadline: form.deadline || null };
      const res = await fetch(`${API_URL}/api/recruiter/jobs`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to post job');
      const jobId = data.id;
      for (const q of customQuestions) {
        await fetch(`${API_URL}/api/recruiter/jobs/${jobId}/questions`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(q) });
      }
      setPostedJob(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  if (postedJob) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-100 px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-8 h-8 text-emerald-400" /></div>
        <h1 className="text-2xl font-bold text-white mb-2">Job Posted!</h1>
        <p className="text-zinc-400 mb-6">"{postedJob.title}" is now live and accepting applications.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/recruiter')} className="px-6 py-3 bg-sky-600 hover:bg-sky-500 rounded-xl font-semibold text-white transition-colors">Back to Dashboard</button>
          <button onClick={() => { setPostedJob(null); setStep(0); setForm({ title: '', description: '', required_skills: '', required_experience: '', required_education: '', cv_match_threshold: 65, total_questions: 10, ai_question_ratio: 0.7, time_limit_minutes: 30, passing_score: 60, deadline: '' }); setCustomQuestions([]); }} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-semibold text-white transition-colors">Post Another Job</button>
        </div>
      </div>
    </div>
  );

  const inp = "w-full bg-zinc-800/50 border border-zinc-700 rounded-xl py-2.5 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all text-sm";
  const lbl = "block text-sm font-medium text-zinc-400 mb-1.5";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="fixed inset-0 pointer-events-none"><div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.08),transparent)]" /></div>
      <nav className="relative border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/recruiter" className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors text-sm"><ArrowLeft className="w-4 h-4" /> Dashboard</Link>
          <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-zinc-900 ring-1 ring-zinc-700 flex items-center justify-center"><Sparkles className="w-3 h-3 text-sky-400" /></div><span className="font-semibold text-white">InterviewIQ</span></div>
        </div>
      </nav>

      <div className="relative max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8"><h1 className="text-3xl font-bold text-white">Post a New Job</h1><p className="text-zinc-400 mt-1">Complete all steps to publish your job listing.</p></div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-2 text-sm ${i === step ? 'text-sky-400' : i < step ? 'text-emerald-400' : 'text-zinc-600'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${i === step ? 'border-sky-500 bg-sky-500/20 text-sky-400' : i < step ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'border-zinc-700 bg-zinc-800 text-zinc-600'}`}>{i < step ? '✓' : i + 1}</div>
                <span className="hidden sm:inline">{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-emerald-500/40' : 'bg-zinc-800'}`} />}
            </React.Fragment>
          ))}
        </div>

        {error && <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-5">
          {/* Step 0: Job Details */}
          {step === 0 && <>
            <div><label className={lbl}>Job Title *</label><input className={inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Senior React Developer" /></div>
            <div><label className={lbl}>Job Description *</label><textarea className={`${inp} resize-none`} rows={5} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe responsibilities, company, role requirements..." /></div>
            <div><label className={lbl}>Required Skills</label><input className={inp} value={form.required_skills} onChange={e => set('required_skills', e.target.value)} placeholder="React, Node.js, PostgreSQL, Docker" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>Required Experience</label><input className={inp} value={form.required_experience} onChange={e => set('required_experience', e.target.value)} placeholder="e.g. 2-3 years" /></div>
              <div><label className={lbl}>Required Education</label><input className={inp} value={form.required_education} onChange={e => set('required_education', e.target.value)} placeholder="e.g. Bachelor's in CS" /></div>
            </div>
            <div><label className={lbl}>Application Deadline</label><input type="datetime-local" className={inp} value={form.deadline} onChange={e => set('deadline', e.target.value)} /></div>
          </>}

          {/* Step 1: Interview Settings */}
          {step === 1 && <>
            <div><label className={lbl}>CV Match Threshold: <span className="text-sky-400 font-bold">{form.cv_match_threshold}%</span></label><input type="range" min="30" max="95" value={form.cv_match_threshold} onChange={e => set('cv_match_threshold', e.target.value)} className="w-full accent-sky-500" /><div className="flex justify-between text-zinc-600 text-xs mt-1"><span>30% (lenient)</span><span>95% (strict)</span></div></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>Total Questions</label><input type="number" min={5} max={20} className={inp} value={form.total_questions} onChange={e => set('total_questions', e.target.value)} /></div>
              <div><label className={lbl}>Time Limit (minutes)</label><input type="number" min={10} max={120} className={inp} value={form.time_limit_minutes} onChange={e => set('time_limit_minutes', e.target.value)} /></div>
            </div>
            <div><label className={lbl}>Passing Score: <span className="text-emerald-400 font-bold">{form.passing_score}%</span></label><input type="range" min="40" max="90" value={form.passing_score} onChange={e => set('passing_score', e.target.value)} className="w-full accent-emerald-500" /></div>
            <div><label className={lbl}>AI vs Custom Question Ratio: <span className="text-amber-400 font-bold">{Math.round(form.ai_question_ratio * 100)}% AI</span></label><input type="range" min="0" max="100" value={form.ai_question_ratio * 100} onChange={e => set('ai_question_ratio', e.target.value / 100)} className="w-full accent-amber-500" /><div className="flex justify-between text-zinc-600 text-xs mt-1"><span>0% AI (all custom)</span><span>100% AI</span></div></div>
          </>}

          {/* Step 2: Custom Questions */}
          {step === 2 && <>
            <p className="text-zinc-400 text-sm">Add your own questions to be mixed with AI-generated ones. (Optional)</p>
            <div className="flex gap-3">
              <textarea 
                className={`${inp} resize-none`} 
                rows={2} 
                value={newQ.question_text} 
                onChange={e => setNewQ({ ...newQ, question_text: e.target.value })} 
                placeholder="Enter your custom question..." 
              />
              <button 
                onClick={addQuestion} 
                className="px-6 bg-sky-600 hover:bg-sky-500 rounded-xl text-sm font-semibold text-white flex items-center justify-center transition-colors shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {customQuestions.length > 0 && (
              <div className="space-y-2 mt-2">
                {customQuestions.map((q, i) => (
                  <div key={i} className="flex items-start gap-3 bg-zinc-800/50 border border-zinc-700 rounded-xl p-3">
                    <div className="flex-1">
                      <p className="text-white text-sm">{q.question_text}</p>
                    </div>
                    <button onClick={() => removeQuestion(i)} className="text-red-400 hover:text-red-300 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {customQuestions.length === 0 && <p className="text-zinc-600 text-sm text-center py-4">No custom questions added. AI will generate all questions.</p>}
          </>}

          {/* Step 3: Review */}
          {step === 3 && <>
            <div className="space-y-3">
              {[['Title', form.title], ['Description', form.description?.slice(0, 120) + (form.description?.length > 120 ? '…' : '')], ['Required Skills', form.required_skills || '—'], ['Experience', form.required_experience || '—'], ['Education', form.required_education || '—'], ['CV Match Threshold', `${form.cv_match_threshold}%`], ['Total Questions', form.total_questions], ['Time Limit', `${form.time_limit_minutes} minutes`], ['Passing Score', `${form.passing_score}%`], ['Custom Questions', customQuestions.length], ['Deadline', form.deadline ? new Date(form.deadline).toLocaleString() : 'No deadline']].map(([k, v]) => (
                <div key={k} className="flex items-start gap-3 py-2 border-b border-zinc-800">
                  <span className="text-zinc-500 text-sm w-40 shrink-0">{k}</span>
                  <span className="text-white text-sm">{v}</span>
                </div>
              ))}
            </div>
          </>}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/recruiter')} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-semibold text-white transition-colors"><ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Cancel' : 'Back'}</button>
          {step < STEPS.length - 1 ? (
            <button onClick={() => { if (step === 0 && !form.title.trim()) { setError('Job title is required.'); return; } setError(''); setStep(s => s + 1); }} className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 rounded-xl text-sm font-semibold text-white transition-colors">Next <ArrowRight className="w-4 h-4" /></button>
          ) : (
            <button onClick={handlePost} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl text-sm font-semibold text-white transition-colors">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />} Publish Job
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostJob;
