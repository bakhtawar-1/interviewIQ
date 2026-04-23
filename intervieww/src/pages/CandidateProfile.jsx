import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, LogOut, User, Upload, CheckCircle, X,
  Briefcase, GraduationCap, Star, Save, ArrowLeft
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          <p className="text-zinc-400 mt-1">Keep your profile complete for better CV match scores.</p>
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
            <div>
              <h2 className="text-white font-semibold">Upload CV</h2>
              <p className="text-zinc-500 text-xs">PDF, DOCX or TXT — auto-fills your profile</p>
            </div>
          </div>
          {profile?.cv_text && (
            <div className="mb-3 text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> CV on file — you can re-upload to update it
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
    </div>
  );
};

export default CandidateProfile;
