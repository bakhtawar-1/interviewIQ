import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, LogOut, User, Upload, CheckCircle, X,
  Briefcase, GraduationCap, Star, Save, ArrowLeft, Info, HelpCircle, FileText
} from 'lucide-react';

const API = 'http://localhost:8000';

const CandidateProfile = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({ full_name: '', skills: '', education: '', experience: '' });
  const [showATSModal, setShowATSModal] = useState(false);

  useEffect(() => {
    if (!token) { navigate('/signin'); return; }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API}/api/candidate/profile`, { headers });
      if (res.status === 401) { navigate('/signin'); return; }
      const data = await res.json();
      setProfile(data);
      setForm({
        full_name: data.full_name || '',
        skills: data.skills || '',
        education: data.education || '',
        experience: data.experience || '',
      });
    } catch (e) {
      setErrorMsg('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API}/api/candidate/profile`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Save failed'); }
      setSuccessMsg('Profile updated successfully!');
      fetchProfile();
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleCVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API}/api/candidate/upload-cv`, {
        method: 'POST',
        headers,
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      setSuccessMsg(`CV uploaded! Extracted ${data.parsed?.skills?.length || 0} skills.`);
      fetchProfile();
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setUploading(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const [showConfirm, setShowConfirm] = useState(false);

  const handleCVDelete = async () => {
    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setShowConfirm(false);
    const targetUrl = `${API}/api/candidate/remove-cv`;
    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Server error (${res.status}) at ${targetUrl}. Please restart your backend.`);
      }
      setSuccessMsg('CV deleted successfully.');
      fetchProfile();
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setUploading(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-sky-500/40 border-t-sky-400 rounded-full animate-spin" />
    </div>
  );

  const skillsArr = (profile?.skills || '').split(',').map(s => s.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.08),transparent)]" />
      </div>

      <nav className="relative border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 ring-1 ring-zinc-700 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-sky-400" />
            </div>
            <span className="font-semibold text-white">InterviewIQ</span>
          </div>
        </div>
      </nav>

      <div className="relative max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">My Profile</h1>
              {profile?.cv_text && (
                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1.5 animate-fade-in">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">CV Active</span>
                </div>
              )}
            </div>
            <p className="text-zinc-400 mt-1">Keep your profile complete for better CV match scores.</p>
          </div>
        </div>

        {successMsg && (
          <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            <X className="w-4 h-4 shrink-0" /> {errorMsg}
          </div>
        )}

        {/* CV Upload */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-sky-500/15 border border-sky-500/20 rounded-lg flex items-center justify-center">
              <Upload className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-white font-semibold">Upload CV</h2>
              <div className="flex items-center gap-2">
                <p className="text-zinc-500 text-xs">Only ATS friendly supported</p>
                <button 
                  onClick={() => setShowATSModal(true)}
                  className="flex items-center gap-1 text-[10px] font-bold text-sky-400 hover:text-sky-300 transition-colors bg-sky-400/10 px-2 py-0.5 rounded-md border border-sky-400/20"
                >
                  <HelpCircle className="w-3 h-3" /> ATS Template Info
                </button>
              </div>
            </div>
          </div>
          {profile?.cv_text && (
            <div className="mb-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center justify-between shadow-sm shadow-emerald-950/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-400">CV Verified & Active</div>
                  <div className="text-[10px] text-zinc-500">Your profile is currently optimized for matching.</div>
                </div>
              </div>
              
              {showConfirm ? (
                <div className="flex items-center gap-3 animate-fade-in-up">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Delete permanent?</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={handleCVDelete}
                      className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg text-[10px] font-bold transition-all"
                    >
                      Yes, Delete
                    </button>
                    <button 
                      onClick={() => setShowConfirm(false)}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg text-[10px] font-bold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowConfirm(true)}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Remove CV
                </button>
              )}
            </div>
          )}
          <label className="cursor-pointer">
            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              uploading ? 'border-sky-500/50 bg-sky-500/5' : 'border-zinc-700 hover:border-sky-500/40 hover:bg-sky-500/5'
            }`}>
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-sky-400/40 border-t-sky-400 rounded-full animate-spin" />
                  <span className="text-sm text-sky-400">Parsing CV…</span>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
                  <p className="text-zinc-400 text-sm">Click to upload your CV</p>
                  <p className="text-zinc-600 text-xs mt-1">Max 5MB</p>
                </>
              )}
            </div>
            <input type="file" accept=".pdf,.docx,.txt,.doc" className="hidden" onChange={handleCVUpload} disabled={uploading} />
          </label>
        </div>

        {/* Skills preview */}
        {skillsArr.length > 0 && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-amber-400" />
              <h2 className="text-white font-semibold text-sm">Detected Skills</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {skillsArr.map((s, i) => (
                <span key={i} className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-300">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Edit form */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-sky-400" /> Personal Information
          </h2>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5 flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400" /> Skills
            </label>
            <textarea
              value={form.skills}
              onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
              placeholder="e.g. Python, React, Machine Learning, SQL"
              rows={3}
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl py-2.5 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all text-sm resize-none"
            />
            <p className="text-zinc-600 text-xs mt-1">Comma-separated list of your skills</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5 flex items-center gap-1">
              <GraduationCap className="w-3 h-3 text-emerald-400" /> Education
            </label>
            <textarea
              value={form.education}
              onChange={e => setForm(f => ({ ...f, education: e.target.value }))}
              placeholder="e.g. BS Computer Science, FAST-NUCES, 2020-2024"
              rows={3}
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl py-2.5 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5 flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-sky-400" /> Experience
            </label>
            <textarea
              value={form.experience}
              onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}
              placeholder="e.g. 2 years at TechCorp as Software Engineer; 1 year internship at StartupXYZ"
              rows={3}
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl py-2.5 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all text-sm resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-colors"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </button>
        </div>
      </div>

      {/* ATS Info Modal */}
      {showATSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-white">ATS-Friendly Guide</h2>
                </div>
                <button onClick={() => setShowATSModal(false)} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 text-sm leading-relaxed">
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/20 mb-6">
                  <img 
                    src="/assets/ats-comparison.png" 
                    alt="ATS Comparison" 
                    className="w-full h-auto object-cover"
                  />
                </div>
                
                <p className="text-zinc-400">
                  Applicant Tracking Systems (ATS) are used by recruiters to automatically scan and rank resumes. To ensure our AI can read your CV correctly, follow these rules:
                </p>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { title: 'Simple Layout', desc: 'Use a single-column layout. Avoid tables, columns, and text boxes.' },
                    { title: 'Standard Fonts', desc: 'Use Arial, Calibri, or Roboto. Avoid complex custom fonts.' },
                    { title: 'Clear Headings', desc: 'Use standard sections like "Experience", "Skills", and "Education".' },
                    { title: 'No Images', desc: 'Do not include photos, charts, or graphics. They confuse the scanner.' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-zinc-800/40 rounded-2xl border border-white/5">
                      <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                      <div>
                        <div className="text-white font-bold mb-0.5">{item.title}</div>
                        <div className="text-zinc-500 text-xs">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <p className="text-emerald-400 text-xs font-medium">
                    Tip: Save your resume as a standard PDF or DOCX file. Our AI works best with clean, text-based documents.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowATSModal(false)}
                className="w-full mt-8 py-3 bg-sky-600 hover:bg-sky-500 rounded-xl font-bold text-white transition-all shadow-lg shadow-sky-950/20"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateProfile;
