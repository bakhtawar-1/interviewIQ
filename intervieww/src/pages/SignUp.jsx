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
  
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'candidate',
    cnic: '',
    company_name: '',
    company_email: ''
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

      if (form.role === 'recruiter') {
        setSuccess(true);
      } else {
        navigate('/signin');
      }
    } catch (err) {
      setError('Cannot connect to server. Make sure the backend is running.');
    } finally {
      setLoading(false);
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
         <h1 className="text-3xl font-bold text-white mb-4">Registration Sent!</h1>
         <p className="text-zinc-400 leading-relaxed mb-8">
           Thank you, <strong>{form.full_name}</strong>. Your recruiter account is currently <span className="text-sky-400 font-semibold">pending admin approval</span>.
         </p>
         <div className="bg-zinc-950/50 rounded-2xl p-6 text-sm text-zinc-500 text-left mb-8 border border-zinc-800/50">
            <p className="flex items-center gap-2 mb-2"><div className="w-1 h-1 rounded-full bg-sky-500" /> Admin will review your company details.</p>
            <p className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-sky-500" /> You will receive an email once approved.</p>
         </div>
         <button onClick={() => navigate('/signin')} className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all">
            Back to Login
         </button>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 relative overflow-hidden py-12">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      <div className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-sky-600 to-sky-700 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">InterviewIQ</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mt-6">Create your account</h1>
          <p className="text-zinc-400 mt-2">Start your AI interview journey today</p>
        </div>

        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-3xl p-8 shadow-2xl">
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
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-all text-sm" />
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">CNIC Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input type="text" name="cnic" value={form.cnic} onChange={handleChange} placeholder="00000-0000000-0" required
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-all text-sm" />
                  </div>
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-all text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Min. 8 characters" required
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl py-3 pl-10 pr-12 text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-all text-sm" />
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
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-sky-500 transition-all appearance-none cursor-pointer text-sm">
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
               </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-4 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 rounded-2xl font-bold text-white transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2 shadow-lg shadow-sky-950/20 mt-4">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
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
