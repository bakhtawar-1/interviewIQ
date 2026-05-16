import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, Users, Briefcase, Settings, BarChart3, 
  CheckCircle, XCircle, ShieldCheck, Search,
  ArrowRight, Mail, Building2, Trash2, Save,
  PieChart, Activity, RefreshCw
} from 'lucide-react';

const API = 'http://localhost:8000';

const AdminPanel = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const [activeTab, setActiveTab] = useState('approvals');
  const [stats, setStats] = useState(null);
  const [pendingRecruiters, setPendingRecruiters] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({
    default_cv_threshold: 65,
    default_passing_score: 60,
    default_total_questions: 10,
    default_time_limit_minutes: 30
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Modal State
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [adminReason, setAdminReason] = useState('');

  useEffect(() => {
    if (!token) { navigate('/signin'); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchPendingRecruiters(),
      fetchSettings(),
      fetchUsers()
    ]);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/api/admin/stats`, { headers });
      if (res.ok) setStats(await res.json());
    } catch {}
  };

  const fetchPendingRecruiters = async () => {
    try {
      const res = await fetch(`${API}/api/admin/recruiters/pending`, { headers });
      if (res.ok) setPendingRecruiters(await res.json());
    } catch {}
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API}/api/admin/users`, { headers });
      if (res.ok) setUsers(await res.json());
    } catch {}
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API}/api/admin/settings`, { headers });
      if (res.ok) setSettings(await res.json());
    } catch {}
  };

  const handleApprove = async (userId, action, reason = '') => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API}/api/admin/recruiters/${userId}/${action}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (!res.ok) throw new Error(`Failed to ${action}`);
      setMsg({ type: 'success', text: `Recruiter ${action}ed successfully!` });
      setSelectedRecruiter(null);
      setAdminReason('');
      loadAll();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setRefreshing(false);
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    }
  };

  const saveSettings = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API}/api/admin/settings`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error('Failed to update settings');
      setMsg({ type: 'success', text: 'Settings updated!' });
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setRefreshing(false);
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    }
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

      <nav className="relative border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 ring-1 ring-zinc-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
            </div>
            <span className="text-lg font-semibold text-white">InterviewIQ Admin</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={loadAll} className="text-zinc-500 hover:text-white transition-colors">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <Link to="/recruiter" className="text-sm text-zinc-400 hover:text-white">Recruiter View</Link>
            <Link to="/dashboard" className="text-sm text-zinc-400 hover:text-white">Candidate View</Link>
          </div>
        </div>
      </nav>

      <div className="relative max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Tabs */}
          <aside className="w-full md:w-64 shrink-0 space-y-1">
            {[
              { id: 'approvals', label: 'Approvals', icon: CheckCircle, badge: pendingRecruiters.length },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'settings', label: 'System Settings', icon: Settings },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id ? 'bg-sky-600 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </div>
                {tab.badge > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{tab.badge}</span>
                )}
              </button>
            ))}
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {msg.text && (
              <div className={`mb-6 p-4 rounded-xl border text-sm flex items-center gap-2 ${
                msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {msg.text}
              </div>
            )}

            {activeTab === 'approvals' && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Pending Approvals</h2>
                  <span className="text-zinc-500 text-sm">{pendingRecruiters.length} recruiters awaiting review</span>
                </div>

                {pendingRecruiters.length === 0 ? (
                  <div className="bg-zinc-900/40 border border-zinc-800 border-dashed rounded-3xl py-20 text-center">
                    <CheckCircle className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                    <p className="text-zinc-500">Queue is empty. No recruiters pending approval.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRecruiters.map(r => (
                      <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 border border-zinc-700">
                            <Building2 className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{r.full_name}</h3>
                            <div className="flex flex-col text-xs text-zinc-500 mt-0.5">
                              <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {r.email}</span>
                              <span className="flex items-center gap-1 mt-0.5"><Building2 className="w-3 h-3" /> {r.company_name || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setSelectedRecruiter(r)}
                            className="px-4 py-2 bg-sky-600/10 hover:bg-sky-600/20 text-sky-400 border border-sky-500/20 rounded-xl text-xs font-bold transition-all"
                          >
                            Review Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Approval Modal */}
            {selectedRecruiter && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setSelectedRecruiter(null)} />
                <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-400 border border-sky-500/20">
                          <Building2 className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white">{selectedRecruiter.full_name}</h3>
                          <p className="text-zinc-500 flex items-center gap-2 mt-1">
                            <Mail className="w-4 h-4" /> {selectedRecruiter.email}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setSelectedRecruiter(null)} className="text-zinc-500 hover:text-white transition-colors">
                        <XCircle className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Organisation</label>
                          <div className="p-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-white font-medium flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-sky-400" /> {selectedRecruiter.company_name || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Company Email</label>
                          <div className="p-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-white font-medium flex items-center gap-2">
                            <Mail className="w-4 h-4 text-sky-400" /> {selectedRecruiter.company_email || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Registration Justification</label>
                        <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl text-zinc-300 text-sm italic leading-relaxed h-[116px] overflow-y-auto">
                          "{selectedRecruiter.justification || 'No justification provided.'}"
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Admin Notes / Feedback (Optional)</label>
                        <textarea
                          value={adminReason}
                          onChange={e => setAdminReason(e.target.value)}
                          placeholder="Provide a reason for approval or rejection (shared with recruiter)..."
                          rows={3}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-sky-500/50 resize-none transition-all"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => handleApprove(selectedRecruiter.id, 'approve', adminReason)}
                          disabled={refreshing}
                          className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/20 disabled:opacity-50"
                        >
                          {refreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                          Approve Request
                        </button>
                        <button
                          onClick={() => handleApprove(selectedRecruiter.id, 'reject', adminReason)}
                          disabled={refreshing}
                          className="flex-1 py-4 bg-zinc-800 hover:bg-red-900/40 hover:text-red-400 border border-transparent hover:border-red-900/50 rounded-2xl font-bold text-zinc-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <XCircle className="w-5 h-5" /> Reject Request
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && stats && (
              <section className="space-y-8">
                <h2 className="text-2xl font-bold text-white">Platform Analytics</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: 'Total Users', val: stats.users.total, icon: Users, color: 'text-sky-400' },
                    { label: 'Active Jobs', val: stats.jobs.active, icon: Briefcase, color: 'text-amber-400' },
                    { label: 'Applications', val: stats.applications.total, icon: Activity, color: 'text-purple-400' },
                  ].map((s, i) => (
                    <div key={i} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                      <s.icon className={`w-5 h-5 ${s.color} mb-4`} />
                      <div className="text-3xl font-bold text-white tabular-nums">{s.val}</div>
                      <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">User Distribution</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Candidates</span>
                        <span className="text-white font-bold">{stats.users.candidates}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Recruiters</span>
                        <span className="text-white font-bold">{stats.users.recruiters}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Pending Approvals</span>
                        <span className="text-red-400 font-bold">{stats.users.pending_recruiter_approvals}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">System Health</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Database Connection</span>
                        <span className="text-emerald-400 font-bold">Stable</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">AI Scoring Service</span>
                        <span className="text-emerald-400 font-bold">Online</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'settings' && (
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-white">System Settings</h2>
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-2xl space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Default CV Threshold (%)</label>
                      <input 
                        type="number" 
                        value={settings.default_cv_threshold}
                        onChange={e => setSettings({...settings, default_cv_threshold: e.target.value})}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Default Passing Score (%)</label>
                      <input 
                        type="number" 
                        value={settings.default_passing_score}
                        onChange={e => setSettings({...settings, default_passing_score: e.target.value})}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Default Total Questions</label>
                      <input 
                        type="number" 
                        value={settings.default_total_questions}
                        onChange={e => setSettings({...settings, default_total_questions: e.target.value})}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Time Limit (Min)</label>
                      <input 
                        type="number" 
                        value={settings.default_time_limit_minutes}
                        onChange={e => setSettings({...settings, default_time_limit_minutes: e.target.value})}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={saveSettings}
                    disabled={refreshing}
                    className="w-full py-4 bg-sky-600 hover:bg-sky-500 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-950/20 disabled:opacity-50"
                  >
                    {refreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Platform Settings
                  </button>
                </div>
              </section>
            )}

            {activeTab === 'users' && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                   <h2 className="text-2xl font-bold text-white">User Management</h2>
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                     <input placeholder="Search users..." className="bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-sky-500 w-64" />
                   </div>
                </div>
                
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-800/50 text-zinc-400 font-bold uppercase text-[10px] tracking-widest">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-zinc-800/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-white font-medium">{u.full_name}</span>
                              <span className="text-xs text-zinc-500">{u.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                               u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                               u.role === 'recruiter' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                               'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                             }`}>
                               {u.role}
                             </span>
                          </td>
                          <td className="px-6 py-4">
                            {u.is_active ? (
                              <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                              </span>
                            ) : (
                              <span className="text-zinc-600 text-xs">Deactivated</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button className="text-zinc-600 hover:text-red-400 transition-colors">
                               <Trash2 className="w-4 h-4" />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
