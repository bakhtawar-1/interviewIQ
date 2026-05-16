import React from 'react';
import { ArrowRight, Sparkles, Play, CheckCircle, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  const highlights = ['No credit card required', 'Free 14-day trial', '24/7 AI support'];

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-6 pt-32 pb-20 overflow-hidden">


      <div className="relative max-w-7xl mx-auto w-full">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500/10 rounded-full border border-sky-500/25 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span className="text-sm font-medium text-sky-200/90">Powered by advanced AI</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.1] tracking-tight">
            <span className="block text-white">Ace Your Interviews</span>
            <span className="block mt-4 text-gradient-premium">With AI Precision</span>
          </h1>


          <p className="text-xl md:text-2xl text-zinc-300 max-w-3xl mx-auto leading-relaxed">
            Transform your interview game with adaptive AI coaching, real-time feedback, and personalized insights
          </p>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
            {highlights.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link
              to="/signup"
              className="px-8 py-4 bg-sky-600 hover:bg-sky-500 rounded-2xl font-semibold text-lg transition-all flex items-center gap-3 shadow-xl shadow-sky-950/40 text-white animate-pulse-glow"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              to="/signup"
              state={{ defaultRole: 'recruiter' }}
              className="px-8 py-4 bg-zinc-900/60 hover:bg-zinc-800/80 backdrop-blur-sm rounded-2xl font-semibold text-lg transition-all border border-zinc-700 hover:border-sky-500/40 text-zinc-100 flex items-center gap-3"
            >
              <Briefcase className="w-5 h-5 text-sky-400" />
              I&apos;m hiring
            </Link>
            <button
              type="button"
              className="px-8 py-4 glass-panel hover:bg-zinc-800/80 rounded-2xl font-bold text-lg transition-all border border-white/10 hover:border-sky-500/50 text-zinc-100 flex items-center gap-3 group"
            >
              <div className="w-8 h-8 bg-sky-500/10 rounded-lg flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
                <Play className="w-5 h-5 text-sky-400" />
              </div>
              Watch Demo
            </button>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;