import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, LogOut, Play, Clock, CheckCircle, TrendingUp,
  User, ChevronRight, Award, Target, BarChart2, Plus
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/signin'); return; }
    fetchData();
    const onFocus = () => fetchData();
    const refreshTimer = setInterval(fetchData, 15000);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(refreshTimer);
      window.removeEventListener('focus', onFocus);
    };
  }, [token]);

  const fetchData = async () => {
    try {
      const meRes = await fetch('http://localhost:8000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (meRes.status === 401) { navigate('/signin'); return; }
      const meData = await meRes.json();
      setUser(meData);

      if (meData.role === 'recruiter') {
        navigate('/recruiter');
        return;
      }

      const intRes = await fetch('http://localhost:8000/api/candidate/interviews', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const intData = await intRes.json();
      setInterviews(Array.isArray(intData) ? intData : []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      // If backend is down, show empty state rather than broken UI
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/signin');
  };

  const normalizeStatus = (status) => {
    if (!status) return 'pending';
    if (typeof status === 'string') return status;
    if (typeof status === 'object' && status.value) return status.value;
    return String(status);
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const interviewsWithStatus = interviews.map((i) => ({
    ...i,
    status: normalizeStatus(i.status),
  }));

  const completed = interviewsWithStatus.filter(i => i.status === 'completed');
  const inProgress = interviewsWithStatus.filter(i => i.status === 'in_progress');
  const completedWithScores = completed.filter(i => i.overall_score != null);
  const avgScore = completedWithScores.length
    ? Math.round(completedWithScores.reduce((sum, i) => sum + i.overall_score, 0) / completedWithScores.length)
    : null;

  const stats = [
    { label: 'Total Interviews', value: interviewsWithStatus.length, icon: BarChart2, color: 'from-sky-600 to-sky-800' },
    { label: 'Completed', value: completed.length, icon: CheckCircle, color: 'from-emerald-600 to-emerald-800' },
    { label: 'In Progress', value: inProgress.length, icon: Clock, color: 'from-slate-600 to-slate-800' },
    { label: 'Avg Score', value: avgScore != null ? `${avgScore}%` : 'N/A', icon: TrendingUp, color: 'from-teal-600 to-teal-800' },
  ];

  const statusColors = {
    completed: 'text-green-400 bg-green-400/10',
    in_progress: 'text-blue-400 bg-blue-400/10',
    pending: 'text-yellow-400 bg-yellow-400/10',
    abandoned: 'text-red-400 bg-red-400/10',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-sky-500/40 border-t-sky-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.1),transparent)]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-slate-800/15 rounded-full blur-3xl" />
      </div>

      <nav className="relative border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 ring-1 ring-zinc-700 flex items-center justify-center group-hover:ring-sky-500/40 transition-shadow">
              <Sparkles className="w-4 h-4 text-sky-400" />
            </div>
            <span className="text-lg font-semibold text-white">InterviewIQ</span>
          </Link>
          <div className="flex items-center gap-4">
            {user?.role === 'admin' && (
              <Link
                to="/recruiter"
                className="text-sm text-zinc-400 hover:text-sky-300 transition-colors"
              >
                Recruiter view
              </Link>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <User className="w-4 h-4" />
              <span>{user?.full_name || 'User'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-red-400/10"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="relative max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white">
            Welcome back, <span className="text-gradient">{user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || user?.username || 'there'}!</span>
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Ready to practice? Your next interview awaits.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((stat, i) => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 backdrop-blur-sm">
              <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-8 mb-10 backdrop-blur-sm ring-1 ring-sky-500/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-sky-400" />
                <span className="text-sky-400/90 font-medium text-sm">Start practicing</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Begin a new interview</h2>
              <p className="text-zinc-400">Choose your difficulty, job title, and type then start answering.</p>
            </div>
            <Link
              to="/interview/new"
              className="flex-shrink-0 flex items-center gap-3 px-8 py-4 bg-sky-600 hover:bg-sky-500 rounded-xl font-semibold text-lg transition-colors shadow-lg shadow-sky-950/30 whitespace-nowrap text-white"
            >
              <Plus className="w-5 h-5" />
              New Interview
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-sky-400" />
            Interview History
          </h2>
          {interviewsWithStatus.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center backdrop-blur-sm">
              <Play className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No interviews yet.</p>
              <p className="text-gray-600 text-sm mt-1">Click "New Interview" above to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {interviewsWithStatus.map((interview) => (
                <div key={interview.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 backdrop-blur-sm flex items-center justify-between hover:border-zinc-600 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-sky-500/15 border border-sky-500/20 rounded-lg flex items-center justify-center">
                      <Play className="w-5 h-5 text-sky-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{interview.job_title || 'General Interview'}</div>
                      <div className="text-gray-500 text-sm capitalize">{interview.interview_type} · {interview.difficulty}</div>
                      <div className="text-gray-500 text-xs mt-1">
                        Created: {formatDate(interview.created_at)}
                        {interview.completed_at ? ` · Completed: ${formatDate(interview.completed_at)}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {interview.overall_score != null && (
                      <div className="text-right">
                        <div className="text-white font-bold">{Math.round(interview.overall_score)}%</div>
                        <div className="text-gray-500 text-xs">Score</div>
                      </div>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[interview.status] || 'text-gray-400 bg-gray-400/10'}`}>
                      {interview.status === 'pending' ? 'not started' : interview.status.replace('_', ' ')}
                    </span>
                    {interview.status === 'in_progress' && (
                      <Link
                        to="/interview/video"
                        className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
                      >
                        Resume
                      </Link>
                    )}
                    {interview.status === 'completed' && (
                      <Link
                        to="/interview/video"
                        className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors"
                      >
                        Start New
                      </Link>
                    )}
                    {interview.status === 'pending' && (
                      <Link
                        to="/interview/video"
                        className="text-xs px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 transition-colors"
                      >
                        Start
                      </Link>
                    )}
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-sky-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
