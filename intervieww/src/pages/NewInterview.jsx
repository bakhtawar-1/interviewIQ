import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, ArrowLeft, ArrowRight, Video, Target, 
  Settings2, BarChart3, Clock, AlertCircle, Briefcase 
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

const NewInterview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const jobFromState = location.state?.jobId;
  const jobTitleFromState = location.state?.jobTitle;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    job_title: jobTitleFromState || 'Full Stack Developer',
    difficulty: 'medium',
    question_count: 5
  });

  const handleStart = () => {
    // If we have a jobId, this is a REAL interview tied to a job application
    const isMock = !jobFromState;
    navigate('/interview/video', { 
      state: { 
        ...form, 
        is_mock: isMock,
        jobId: jobFromState 
      } 
    });
  };

  const roles = [
    'Full Stack Developer', 'Frontend Engineer', 'Backend Engineer', 
    'Product Manager', 'Data Scientist', 'UI/UX Designer', 'DevOps Engineer'
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.1),transparent)]" />
      </div>

      <nav className="relative border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 ring-1 ring-zinc-700 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-sky-400" />
            </div>
            <span className="font-semibold text-white">InterviewIQ</span>
          </div>
        </div>
      </nav>

      <div className="relative max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            {jobFromState ? 'Official Interview' : 'Practice Session'}
          </h1>
          <p className="text-zinc-400">
            {jobFromState 
              ? `You are starting your official interview for ${jobTitleFromState}. Good luck!` 
              : 'Sharpen your skills with an AI-driven mock interview.'}
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 space-y-8">
           
           <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                 <Target className="w-4 h-4 text-sky-400" /> {jobFromState ? 'Applying For' : 'Target Role'}
              </h3>
              {jobFromState ? (
                <div className="bg-sky-500/10 border border-sky-500/20 p-5 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-sky-400">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg">{jobTitleFromState}</div>
                    <div className="text-zinc-500 text-xs">Official AI Interview Session</div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {roles.map(r => (
                    <button 
                      key={r}
                      onClick={() => setForm({...form, job_title: r})}
                      className={`text-left px-5 py-3 rounded-xl border text-sm transition-all ${
                        form.job_title === r ? 'bg-sky-600 border-sky-500 text-white font-bold' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                  <input 
                    placeholder="Or type a custom role..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-5 text-sm focus:outline-none focus:border-sky-500"
                    onChange={e => setForm({...form, job_title: e.target.value})}
                  />
                </div>
              )}
           </div>

           {!jobFromState ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                     <BarChart3 className="w-4 h-4 text-amber-400" /> Difficulty
                  </h3>
                  <div className="flex gap-2">
                     {['easy', 'medium', 'hard'].map(d => (
                       <button 
                        key={d}
                        onClick={() => setForm({...form, difficulty: d})}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${
                          form.difficulty === d ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                        }`}
                       >
                         {d}
                       </button>
                     ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                     <Clock className="w-4 h-4 text-emerald-400" /> Duration
                  </h3>
                  <select 
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2 px-4 text-sm text-zinc-300 focus:outline-none"
                    value={form.question_count}
                    onChange={e => setForm({...form, question_count: Number(e.target.value)})}
                  >
                    <option value={3}>Short (3 Questions)</option>
                    <option value={5}>Standard (5 Questions)</option>
                    <option value={10}>Comprehensive (10 Questions)</option>
                  </select>
                </div>
             </div>
           ) : (
             <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 text-center">
               <h3 className="text-emerald-400 font-bold text-xl mb-1">Good luck!</h3>
               <p className="text-zinc-400 text-sm">Your interview duration and difficulty have been configured by the recruiter.</p>
             </div>
           )}

           <div className="pt-6 border-t border-zinc-800">
              <div className="bg-sky-500/5 border border-sky-500/10 rounded-2xl p-4 flex gap-4 mb-6">
                 <AlertCircle className="w-5 h-5 text-sky-400 shrink-0" />
                 <div className="text-xs text-zinc-500 leading-relaxed">
                   AI proctoring is enabled for mock sessions to help you simulate a real environment. Ensure your camera and mic are ready.
                 </div>
              </div>

              <button 
                onClick={handleStart}
                className="w-full py-4 bg-sky-600 hover:bg-sky-500 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-sky-950/20"
              >
                {jobFromState ? 'Start Official Interview' : 'Start Practice'} <ArrowRight className="w-5 h-5" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default NewInterview;
