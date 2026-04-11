import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, ArrowRight, Video } from 'lucide-react';

const NewInterview = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/interview/video');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.1),transparent)]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-slate-800/15 rounded-full blur-3xl" />
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
          <h1 className="text-4xl font-semibold text-white mb-3 tracking-tight">Set up your interview</h1>
          <p className="text-zinc-400">Only video interview mode is enabled.</p>
        </div>

        <div className="mb-10 bg-sky-500/10 border border-sky-500/20 rounded-xl p-5">
          <div className="text-sky-300 font-medium mb-2 flex items-center gap-2">
            <Video className="w-4 h-4" /> About video interviews
          </div>
          <ul className="text-zinc-400 text-sm space-y-1.5">
            <li>• AI-proctored interview with camera checks</li>
            <li>• Allow camera and microphone when browser asks</li>
            <li>• Face the camera and stay on this tab during interview</li>
            <li>• Works best in Chrome or Edge</li>
          </ul>
        </div>

        <button onClick={handleStart}
          className="w-full py-4 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-colors shadow-lg shadow-sky-950/30 text-white">
          <>Start Video Interview <ArrowRight className="w-5 h-5" /></>
        </button>
      </div>
    </div>
  );
};

export default NewInterview;
