import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, ArrowRight, Mail, Lock } from 'lucide-react';

import { API_URL } from '../config';

const SignIn = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });
  
  // Forgot Password flow states
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'reset'
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        let msg = data.detail;
        if (typeof msg === 'object' && msg !== null) {
          if (Array.isArray(msg)) {
            msg = msg.map(err => `${err.loc[err.loc.length - 1]}: ${err.msg}`).join(', ');
          } else {
            msg = JSON.stringify(msg);
          }
        }
        setError(msg || 'Login failed.');
        return;
      }

      localStorage.setItem('token', data.access_token);

      const meRes = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (meRes.ok) {
        const me = await meRes.json();
        if (me.role === 'recruiter') {
          navigate('/recruiter');
          return;
        }
        if (me.role === 'admin') {
          navigate('/admin');
          return;
        }
      }
      navigate('/dashboard');
    } catch (err) {
      setError('Cannot connect to server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send reset code');
      
      setSuccessMsg(data.message);
      if (data.debug_otp) {
        setSuccessMsg(`[DEBUG] Reset Code: ${data.debug_otp}`);
      }
      setView('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp_code: otp, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Reset failed');
      
      setSuccessMsg('Password reset successful! You can now sign in.');
      setView('login');
      setForm({ ...form, email: forgotEmail });
    } catch (err) {
      setError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 relative overflow-hidden selection:bg-sky-500/30">
      {/* Background Layer */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 scale-110 blur-sm"
          style={{ backgroundImage: 'url("/assets/auth-bg.png")' }}
        />
        <div className="absolute inset-0 bg-mesh opacity-70" />
        <div className="absolute inset-0 bg-zinc-950/60" />
      </div>

      <div className="relative w-full max-w-md z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 bg-gradient-to-r from-sky-600 to-indigo-600 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform shadow-lg shadow-sky-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">InterviewIQ</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mt-8 tracking-tight">Welcome back</h1>
          <p className="text-zinc-400 mt-2">Sign in to continue your practice</p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-3xl p-8 shadow-2xl border border-white/10">


          {successMsg && (
            <div className="mb-5 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
              {successMsg}
            </div>
          )}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {view === 'login' && (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      required
                      className="w-full bg-zinc-800/40 border border-white/10 rounded-2xl py-3.5 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-zinc-300">Password</label>
                    <button 
                      type="button"
                      onClick={() => { setView('forgot'); setError(''); setSuccessMsg(''); }}
                      className="text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Your password"
                      required
                      className="w-full bg-zinc-800/40 border border-white/10 rounded-2xl py-3.5 pl-10 pr-12 text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl shadow-sky-500/20 mt-4 animate-pulse-glow"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-gray-400 text-sm mt-6">
                Don't have an account?{' '}
                <Link to="/signup" className="text-sky-400 hover:text-sky-300 font-medium transition-colors">
                  Sign up free
                </Link>
              </p>
            </>
          )}

          {view === 'forgot' && (
            <>
              <div className="mb-6">
                <h3 className="text-white font-bold text-lg mb-1">Reset Password</h3>
                <p className="text-zinc-500 text-sm">Enter your email and we'll send you a recovery code.</p>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full bg-zinc-800/40 border border-white/10 rounded-2xl py-3.5 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-4 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-950/20"
                >
                  {forgotLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send Reset Code'}
                </button>
                <button 
                  type="button"
                  onClick={() => setView('login')}
                  className="w-full text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors"
                >
                  ← Back to Sign In
                </button>
              </form>
            </>
          )}

          {view === 'reset' && (
            <>
              <div className="mb-6">
                <h3 className="text-white font-bold text-lg mb-1">Verify Code</h3>
                <p className="text-zinc-500 text-sm">Enter the code sent to {forgotEmail}</p>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Verification Code</label>
                  <input
                    type="text"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    required
                    className="w-full bg-zinc-800/40 border border-white/10 rounded-2xl py-3.5 text-center text-2xl font-bold tracking-[0.5em] text-white focus:outline-none focus:border-sky-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      required
                      className="w-full bg-zinc-800/40 border border-white/10 rounded-2xl py-3.5 pl-10 pr-4 text-white focus:outline-none focus:border-sky-500 transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20"
                >
                  {forgotLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignIn;
