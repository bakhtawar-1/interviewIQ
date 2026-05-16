import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Sparkles, Eye, EyeOff, ArrowRight, User, Mail, 
  Lock, Briefcase, CreditCard, Building2, CheckCircle, XCircle 
} from 'lucide-react';

const API = 'http://localhost:8000';

const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending, setResending] = useState(false);
  
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'candidate',
    cnic: '',
    company_name: '',
    company_email: '',
    justification: ''
  });

  useEffect(() => {
    if (location.state?.defaultRole === 'recruiter') {
      setForm((f) => ({ ...f, role: 'recruiter' }));
    }
  }, [location.state]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic CNIC validation format
    if (form.role !== 'admin' && !/^\d{5}-\d{7}-\d$/.test(form.cnic)) {
       setError('CNIC must be in format: 00000-0000000-0');
       setLoading(false);
       return;
    }

    // Clean up data based on role
    const submitData = { ...form };
    if (form.role === 'candidate') {
      delete submitData.company_name;
      delete submitData.company_email;
    }

    try {
      const response = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        let msg = data.detail;
        if (typeof msg === 'object' && msg !== null) {
          // Handle Pydantic validation errors (array of objects)
          if (Array.isArray(msg)) {
            msg = msg.map(err => `${err.loc[err.loc.length - 1]}: ${err.msg}`).join(', ');
          } else {
            msg = JSON.stringify(msg);
          }
        }
        setError(msg || 'Registration failed.');
        return;
      }

      if (response.ok) {
        if (data.debug_otp) {
          setError(`[DEBUG MODE] Your OTP is: ${data.debug_otp}`);
        }
        setIsVerifying(true);
      }
    } catch (err) {
      setError('Cannot connect to server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setOtpLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp_code: otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Verification failed');

      if (form.role === 'recruiter') {
        setSuccess(true);
      } else {
        navigate('/signin', { state: { message: 'Email verified! Please sign in.' } });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      if (!res.ok) throw new Error('Failed to resend OTP');
      alert('A new OTP has been sent to your email.');
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  if (success) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 relative">
       <div className="absolute top-1/4 -left-20 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-pulse"></div>
       <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
       
       <div className="relative bg-zinc-900/80 border border-zinc-800 rounded-3xl p-10 max-w-md text-center shadow-2xl backdrop-blur-md">
         <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
         </div>
         <h1 className="text-3xl font-bold text-white mb-4">Email Verified!</h1>
         <p className="text-zinc-400 leading-relaxed mb-8">
           Thank you, <strong>{form.full_name}</strong>. Your recruiter account is now <span className="text-sky-400 font-semibold">pending admin approval</span>.
         </p>
         <div className="bg-zinc-950/50 rounded-2xl p-6 text-sm text-zinc-500 text-left mb-8 border border-zinc-800/50">
            <p className="flex items-center gap-2 mb-2"><div className="w-1 h-1 rounded-full bg-sky-500" /> Email verification successful.</p>
            <p className="flex items-center gap-2 mb-2"><div className="w-1 h-1 rounded-full bg-sky-500" /> Admin will review your company details.</p>
            <p className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-sky-500" /> You will receive an email once approved.</p>
         </div>
         <button onClick={() => navigate('/signin')} className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all">
            Back to Login
         </button>
       </div>
    </div>
  );

  if (isVerifying) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-sky-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Verify your email</h1>
          <p className="text-zinc-400 mt-2">We've sent a 6-digit code to <span className="text-sky-400">{form.email}</span></p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-4 text-center">Enter Verification Code</label>
              <input
                type="text"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                required
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-5 text-center text-3xl font-bold tracking-[0.5em] text-white focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all placeholder:text-zinc-800"
              />
            </div>

            <button
              type="submit"
              disabled={otpLoading || otp.length !== 6}
              className="w-full py-4 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 rounded-2xl font-bold text-white transition-all shadow-xl shadow-sky-500/20 flex items-center justify-center gap-2"
            >
              {otpLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify Account'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-zinc-500 mb-2">Didn't receive the code?</p>
            <button
              onClick={handleResendOTP}
              disabled={resending}
              className="text-sky-400 hover:text-sky-300 font-bold transition-colors disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend OTP'}
            </button>
          </div>
        </div>
        
        <button 
          onClick={() => setIsVerifying(false)}
          className="w-full mt-6 py-4 text-zinc-500 hover:text-zinc-300 transition-colors text-sm font-medium"
        >
          ← Back to registration
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 relative overflow-hidden py-12 selection:bg-sky-500/30">
      {/* Background Layer */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 scale-110 blur-sm"
          style={{ backgroundImage: 'url("/assets/auth-bg.png")' }}
        />
        <div className="absolute inset-0 bg-mesh opacity-70" />
        <div className="absolute inset-0 bg-zinc-950/60" />
      </div>

      <div className="relative w-full max-w-lg z-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 bg-gradient-to-r from-sky-600 to-indigo-600 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform shadow-lg shadow-sky-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">InterviewIQ</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mt-8 tracking-tight">Create your account</h1>
          <p className="text-zinc-400 mt-2">Start your AI interview journey today</p>
        </div>

        <div className="glass-panel rounded-3xl p-8 shadow-2xl border border-white/10">

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input type="text" name="full_name" value={form.full_name} onChange={handleChange} placeholder="John Doe" required
                      className="w-full bg-zinc-800/40 border border-white/10 rounded-2xl py-3.5 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all text-sm" />
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">CNIC Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input type="text" name="cnic" value={form.cnic} onChange={handleChange} placeholder="00000-0000000-0" required
                      className="w-full bg-zinc-800/40 border border-white/10 rounded-2xl py-3.5 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all text-sm" />
                  </div>
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required
                  className="w-full bg-zinc-800/40 border border-white/10 rounded-2xl py-3.5 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Min. 8 characters" required
                  className="w-full bg-zinc-800/40 border border-white/10 rounded-2xl py-3.5 pl-10 pr-12 text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">I am a...</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <select name="role" value={form.role} onChange={handleChange}
                  className="w-full bg-zinc-800/40 border border-white/10 rounded-2xl py-3.5 pl-10 pr-4 text-white focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all appearance-none cursor-pointer text-sm">
                  <option value="candidate">Candidate (Job Seeker)</option>
                  <option value="recruiter">Recruiter (Hiring Manager)</option>
                </select>
              </div>
            </div>

            {form.role === 'recruiter' && (
               <div className="pt-4 border-t border-zinc-800 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Company Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Company Name</label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                          <input type="text" name="company_name" value={form.company_name} onChange={handleChange} placeholder="TechCorp Ltd." required
                            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-sky-500" />
                        </div>
                     </div>
                     <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Company Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                          <input type="email" name="company_email" value={form.company_email} onChange={handleChange} placeholder="hr@techcorp.com" required
                            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-sky-500" />
                        </div>
                     </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Justification / Request Notes</label>
                    <textarea 
                      name="justification" 
                      value={form.justification} 
                      onChange={handleChange} 
                      placeholder="Tell us why you want to use InterviewIQ for your team..." 
                      rows={3} 
                      required
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-sky-500 resize-none" 
                    />
                  </div>
               </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 rounded-2xl font-bold text-white transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 shadow-xl shadow-sky-500/20 mt-4 animate-pulse-glow">
              {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create Account <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <p className="text-center text-zinc-500 text-sm mt-8">
            Already have an account?{' '}
            <Link to="/signin" className="text-sky-400 hover:text-sky-300 font-semibold transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
