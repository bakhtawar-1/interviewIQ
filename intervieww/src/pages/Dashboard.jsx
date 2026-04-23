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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.08),transparent)]" />
      </div>

      <nav className="relative border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 ring-1 ring-zinc-700/80 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-sky-400" />
            </div>
            <span className="text-lg font-semibold text-white">InterviewIQ</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/jobs" className="text-sm text-zinc-400 hover:text-white transition-colors">Find Jobs</Link>
            <Link to="/profile" className="flex items-center gap-2 group">
               <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center group-hover:border-sky-500/50 transition-colors">
                  <User className="w-4 h-4 text-zinc-400 group-hover:text-sky-400" />
               </div>
               <span className="text-sm text-zinc-300 hidden sm:inline">{user?.full_name?.split(' ')[0]}</span>
            </Link>
            <button onClick={handleLogout} className="text-zinc-500 hover:text-red-400 transition-colors"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </nav>

      <div className="relative max-w-7xl mx-auto px-6 py-10">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-white tracking-tight">Welcome, <span className="text-sky-400">{user?.full_name?.split(' ')[0]}!</span></h1>
          <p className="text-zinc-400 mt-2 text-lg">Your candidate hub for AI interviews and job applications.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Applications', val: applications.length, icon: Briefcase, color: 'text-sky-400', bg: 'bg-sky-500/10' },
            { label: 'Mock Sessions', val: interviews.length, icon: Play, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { label: 'Completed', val: completed.length, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Avg AI Score', val: `${avgScore}%`, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map((s, i) => (
            <div key={i} className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-4`}>
                 <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className="text-3xl font-bold text-white tabular-nums">{s.val}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Link to="/jobs" className="bg-sky-600 hover:bg-sky-500 p-6 rounded-2xl flex flex-col justify-between h-48 transition-all group shadow-lg shadow-sky-950/20">
                  <Search className="w-8 h-8 text-white/50 group-hover:text-white transition-colors" />
                  <div>
                    <h3 className="text-xl font-bold text-white">Find a Job</h3>
                    <p className="text-sky-100 text-sm mt-1">Browse active listings and apply with your AI profile.</p>
                  </div>
               </Link>
               <Link to="/interview/new" className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 p-6 rounded-2xl flex flex-col justify-between h-48 transition-all group">
                  <Play className="w-8 h-8 text-sky-400/50 group-hover:text-sky-400 transition-colors" />
                  <div>
                    <h3 className="text-xl font-bold text-white">Practice Interview</h3>
                    <p className="text-zinc-500 text-sm mt-1">Take a mock interview to improve your AI score.</p>
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
                 <div className="space-y-3">
                    {applications.slice(0, 3).map(app => (
                      <div key={app.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700"><Building2 className="w-5 h-5 text-zinc-500" /></div>
                            <div>
                               <h4 className="font-bold text-white text-sm">{app.job_title}</h4>
                               <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5">{app.status.replace('_', ' ')}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <div className="text-sm font-bold text-sky-400">{app.cv_match_score?.toFixed(0)}%</div>
                            <div className="text-[9px] text-zinc-500 uppercase font-bold">Match</div>
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
               <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6">
                  <div className="space-y-6">
                    {interviews.length === 0 ? (
                       <p className="text-zinc-600 text-center text-sm py-4">No recent activity.</p>
                    ) : (
                       interviews.slice(0, 5).map(int => (
                         <div key={int.id} className="flex gap-4 relative">
                            <div className="shrink-0 w-2 h-2 rounded-full bg-sky-500 mt-1.5" />
                            <div className="pb-6 border-l border-zinc-800 pl-6 -ml-5 last:border-0 last:pb-0">
                               <p className="text-sm text-white font-medium">{int.status === 'completed' ? 'Finished session' : 'Started session'}</p>
                               <p className="text-[10px] text-zinc-500 uppercase font-bold mt-1">{int.job_title || 'Mock Practice'}</p>
                               <p className="text-[9px] text-zinc-600 mt-2">{new Date(int.created_at).toLocaleDateString()}</p>
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
