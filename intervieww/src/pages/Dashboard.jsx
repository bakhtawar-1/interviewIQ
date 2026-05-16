import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, LogOut, Play, Clock, CheckCircle, TrendingUp,
  User, ChevronRight, Award, Target, BarChart2, Plus,
  Briefcase, FileText, LayoutDashboard, Search, Activity, Building2
} from 'lucide-react';

const API = 'http://localhost:8000';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/signin'); return; }
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const meRes = await fetch(`${API}/api/auth/me`, { headers });
      if (meRes.status === 401) { navigate('/signin'); return; }
      const meData = await meRes.json();
      setUser(meData);

      if (meData.role === 'recruiter') { navigate('/recruiter'); return; }
      if (meData.role === 'admin') { navigate('/admin'); return; }

      // Parallel fetch
      const [intRes, appRes] = await Promise.all([
        fetch(`${API}/api/candidate/interviews`, { headers }),
        fetch(`${API}/api/candidate/applications`, { headers })
      ]);

      const intData = await intRes.json();
      const appData = await appRes.json();

      setInterviews(Array.isArray(intData) ? intData : []);
      setApplications(Array.isArray(appData) ? appData : []);
      
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/signin');
  };

  const completed = interviews.filter(i => i.status === 'completed');
  const avgScore = completed.length
    ? Math.round(completed.reduce((sum, i) => sum + (i.overall_score || 0), 0) / completed.length)
    : 0;

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-sky-500/40 border-t-sky-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-sky-500/30">
      {/* Background Layer */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10 scale-105"
          style={{ backgroundImage: 'url("/assets/hero-bg.png")' }}
        />
        <div className="absolute inset-0 bg-mesh opacity-50" />
        <div className="absolute inset-0 bg-zinc-950/40" />
      </div>

      <nav className="relative border-b border-white/5 glass-navbar sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 flex items-center justify-center group-hover:rotate-6 transition-transform shadow-lg shadow-sky-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">InterviewIQ</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/jobs" className="text-sm text-zinc-400 hover:text-white transition-colors">Find Jobs</Link>
            <Link to="/profile" className="flex items-center gap-2 group">
               <div className="w-9 h-9 rounded-full bg-zinc-800/50 border border-white/10 flex items-center justify-center group-hover:border-sky-500/50 transition-colors">
                  <User className="w-4 h-4 text-zinc-400 group-hover:text-sky-400" />
               </div>
               <span className="text-sm text-zinc-300 hidden sm:inline font-medium">{user?.full_name?.split(' ')[0]}</span>
            </Link>
            <button onClick={handleLogout} className="text-zinc-500 hover:text-red-400 transition-colors"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </nav>

      <div className="relative max-w-7xl mx-auto px-6 py-10 z-10 animate-fade-in-up">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-white tracking-tight">Welcome, <span className="text-gradient-premium">{user?.full_name?.split(' ')[0]}!</span></h1>
          <p className="text-zinc-400 mt-2 text-lg">Your candidate hub for AI interviews and job applications.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Applications', val: applications.length, icon: Briefcase, color: 'text-sky-400', bg: 'bg-sky-500/10' },
            { label: 'Mock Sessions', val: interviews.length, icon: Play, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { label: 'Completed', val: completed.length, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Avg AI Score', val: `${avgScore}%`, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map((s, i) => (
            <div key={i} className="glass-card p-6 rounded-3xl hover-lift">
              <div className={`w-12 h-12 ${s.bg} rounded-2xl flex items-center justify-center mb-5 shadow-inner`}>
                 <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
              <div className="text-3xl font-bold text-white tabular-nums tracking-tight">{s.val}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-black mt-1.5">{s.label}</div>
            </div>
          ))}
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Link to="/jobs" className="bg-gradient-to-br from-sky-600 to-indigo-700 hover:from-sky-500 hover:to-indigo-600 p-6 rounded-3xl flex flex-col justify-between h-52 transition-all group shadow-xl shadow-sky-500/20 hover-lift">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Find a Job</h3>
                    <p className="text-sky-100/80 text-sm mt-2 leading-relaxed">Browse top tech listings and apply instantly with your verified score.</p>
                  </div>
               </Link>
               <Link to="/interview/new" className="glass-card hover:border-sky-500/50 p-6 rounded-3xl flex flex-col justify-between h-52 transition-all group hover-lift shadow-xl">
                  <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
                    <Play className="w-6 h-6 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Practice Interview</h3>
                    <p className="text-zinc-400 text-sm mt-2 leading-relaxed">Take a mock interview and get instant AI feedback to improve your score.</p>
                  </div>
               </Link>
            </div>

            {/* My Applications Section */}
            <section>
               <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2"><Briefcase className="w-5 h-5 text-sky-400" /> Recent Applications</h2>
                  <Link to="/applications" className="text-xs font-bold text-sky-400 hover:underline uppercase tracking-widest">View all</Link>
               </div>
               {applications.length === 0 ? (
                 <div className="bg-zinc-900/40 border border-zinc-800 border-dashed rounded-3xl py-12 text-center">
                    <p className="text-zinc-600 text-sm">You haven't applied to any jobs yet.</p>
                 </div>
               ) : (
                  <div className="space-y-4">
                     {applications.slice(0, 3).map(app => (
                       <div key={app.id} className="glass-card p-5 flex items-center justify-between hover:bg-zinc-800/20 rounded-2xl group">
                          <div className="flex items-center gap-5">
                             <div className="w-12 h-12 bg-zinc-800/50 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-sky-500/30 transition-colors">
                               <Building2 className="w-6 h-6 text-zinc-400 group-hover:text-sky-400 transition-colors" />
                             </div>
                             <div>
                                <h4 className="font-bold text-white tracking-tight">{app.job_title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`w-1.5 h-1.5 rounded-full ${app.interview_status === 'disqualified' ? 'bg-red-500' : 'bg-sky-500'}`} />
                                  <p className={`text-[10px] uppercase tracking-widest font-black ${app.interview_status === 'disqualified' ? 'text-red-400' : 'text-zinc-500'}`}>
                                     {app.interview_status === 'disqualified' ? 'Disqualified' : app.status.replace('_', ' ')}
                                  </p>
                                </div>
                             </div>
                          </div>
                          <div className="text-right">
                             <div className="text-lg font-bold text-sky-400 tracking-tight">{app.cv_match_score?.toFixed(0)}%</div>
                             <div className="text-[9px] text-zinc-500 uppercase font-black tracking-wider mt-0.5">Match Score</div>
                          </div>
                       </div>
                     ))}
                  </div>
               )}
            </section>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            <section>
               <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-purple-400" /> Activity</h2>
               <div className="glass-panel p-8 rounded-3xl">
                  <div className="space-y-8">
                    {interviews.length === 0 ? (
                       <p className="text-zinc-600 text-center text-sm py-8 font-medium">No recent interview activity.</p>
                    ) : (
                       interviews.slice(0, 5).map((int, idx) => (
                         <div key={int.id} className="flex gap-5 relative group">
                            <div className="shrink-0 w-3 h-3 rounded-full bg-sky-500/30 border border-sky-500 mt-1.5 group-hover:scale-125 transition-transform" />
                            <div className={`pb-8 border-l border-white/5 pl-8 -ml-[22px] last:border-0 last:pb-0`}>
                               <p className="text-sm text-white font-bold tracking-tight">
                                   {int.status === 'completed' ? 'Session Completed' : 
                                    int.status === 'disqualified' ? 'Disqualified (Violations)' : 
                                    'Session Started'}
                                </p>
                               <p className="text-[11px] text-zinc-400 font-medium mt-1.5 bg-zinc-800/50 inline-block px-2.5 py-1 rounded-lg border border-white/5">
                                 {int.job_title || 'Mock Practice'}
                               </p>
                               <p className="text-[10px] text-zinc-500 font-bold mt-3 flex items-center gap-1.5">
                                 <Clock className="w-3 h-3" /> {new Date(int.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                               </p>
                            </div>
                         </div>
                       ))
                    )}
                  </div>
               </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
