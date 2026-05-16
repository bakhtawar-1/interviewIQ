import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowLeft, Briefcase, Users, Target, Clock,
  Edit, Trash2, CheckCircle, XCircle, ChevronRight,
  FileText, Activity, Search
} from 'lucide-react';

import { API_URL } from '../config';

const RecruiterJobManagement = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`${API_URL}/api/recruiter/jobs/${jobId}`, { headers });
        if (!res.ok) throw new Error('Job not found');
        const data = await res.json();
        setJob(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId]);

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-sky-500/40 border-t-sky-400 rounded-full animate-spin" />
    </div>
  );

  if (error || !job) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-center">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Oops! {error}</h2>
        <Link to="/recruiter" className="text-sky-400 hover:underline">Back to Dashboard</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased pb-20">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.08),transparent)]" />
      </div>

      <nav className="relative border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/recruiter" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 ring-1 ring-zinc-700/80 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-sky-400" />
            </div>
            <span className="font-semibold text-white">Job Manager</span>
          </div>
        </div>
      </nav>

      <div className="relative max-w-[1200px] mx-auto px-6 py-10">
        
        {/* Job Header */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 mb-8">
           <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div>
                 <div className="flex items-center gap-3 mb-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${job.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
                      {job.is_active ? 'Active' : 'Deactivated'}
                    </span>
                    <span className="text-zinc-500 text-xs">Posted on {new Date(job.created_at).toLocaleDateString()}</span>
                 </div>
                 <h1 className="text-4xl font-bold text-white mb-2">{job.title}</h1>
                 <p className="text-zinc-400 max-w-2xl leading-relaxed">{job.description}</p>
              </div>
              <div className="flex gap-2">
                 <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
                   <Edit className="w-4 h-4" /> Edit Job
                 </button>
                 <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
                   <Trash2 className="w-4 h-4" /> Close
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-10 border-t border-zinc-800/50">
              <div className="space-y-1">
                 <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-2"><Users className="w-3 h-3" /> Applications</div>
                 <div className="text-2xl font-bold text-white">{job.application_count}</div>
              </div>
              <div className="space-y-1">
                 <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-2"><Target className="w-3 h-3" /> Threshold</div>
                 <div className="text-2xl font-bold text-sky-400">{job.cv_match_threshold}%</div>
              </div>
              <div className="space-y-1">
                 <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-2"><FileText className="w-3 h-3" /> Questions</div>
                 <div className="text-2xl font-bold text-white">{job.total_questions} <span className="text-xs font-normal text-zinc-500">({job.custom_questions?.length || 0} custom)</span></div>
              </div>
              <div className="space-y-1">
                 <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-2"><Clock className="w-3 h-3" /> Time Limit</div>
                 <div className="text-2xl font-bold text-white">{job.time_limit_minutes}m</div>
              </div>
           </div>
        </div>

        {/* Requirements & Questions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
           <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-sky-400" /> Screening Criteria</h3>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Required Skills</label>
                    <div className="flex flex-wrap gap-2">
                       {job.required_skills.split(',').map(s => (
                         <span key={s} className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-xs border border-zinc-700">{s.trim()}</span>
                       ))}
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Min Experience</label>
                       <p className="text-white font-medium">{job.required_experience} Years</p>
                    </div>
                    <div>
                       <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Min Education</label>
                       <p className="text-white font-medium">{job.required_education}</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-lg font-bold text-white flex items-center gap-2"><Search className="w-5 h-5 text-amber-400" /> Custom Questions</h3>
                 <span className="text-xs text-zinc-500">{job.custom_questions?.length || 0} items</span>
              </div>
              <div className="space-y-3">
                 {job.custom_questions?.length === 0 ? (
                   <div className="py-10 text-center border border-dashed border-zinc-800 rounded-2xl">
                      <p className="text-zinc-600 text-sm">No custom questions added yet.</p>
                   </div>
                 ) : (
                   job.custom_questions.map((q, idx) => (
                     <div key={q.id} className="p-3 bg-zinc-800/30 border border-zinc-800 rounded-xl flex gap-3">
                        <span className="text-zinc-600 font-bold"># {idx+1}</span>
                        <div>
                           <p className="text-sm text-zinc-300">{q.question_text}</p>
                           <p className="text-[9px] text-zinc-500 uppercase font-bold mt-1">Difficulty: {q.difficulty}</p>
                        </div>
                     </div>
                   ))
                 )}
              </div>
           </div>
        </div>

        {/* View Applications Prompt */}
        <div className="bg-sky-600 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-sky-950/20">
           <div>
              <h2 className="text-3xl font-bold text-white mb-2">Ready to screen?</h2>
              <p className="text-sky-100 opacity-80">You have {job.application_count} candidates waiting for review.</p>
           </div>
           <button 
             onClick={() => navigate(`/recruiter/jobs/${job.id}/applications`)}
             className="px-8 py-4 bg-white text-sky-600 rounded-2xl font-bold text-lg hover:bg-sky-50 transition-all flex items-center gap-2"
           >
             Go to Applications <ChevronRight className="w-5 h-5" />
           </button>
        </div>

      </div>
    </div>
  );
};

export default RecruiterJobManagement;
