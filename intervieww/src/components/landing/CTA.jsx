import React from 'react';
import { ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const CTA = () => {
  const benefits = ["Start free for 14 days", "No credit card required", "Cancel anytime"];

  return (
    <section className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="relative glass-panel rounded-[3rem] overflow-hidden p-12 sm:p-20 text-center shadow-2xl">
          <div className="absolute inset-0 bg-mesh opacity-30" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500/10 border border-sky-500/20 rounded-full mb-10">
              <Sparkles className="w-5 h-5 text-sky-400" />
              <span className="text-sm font-bold text-sky-200 tracking-wide uppercase">Limited time offer</span>
            </div>

            <h2 className="text-4xl md:text-7xl font-black mb-8 text-white tracking-tighter leading-[1.1]">
              Ready to <span className="text-gradient-premium">transform</span> your <br className="hidden md:block" /> interview experience?
            </h2>

            <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join thousands of candidates using InterviewIQ to practice and hire with AI-driven confidence.
            </p>

            <div className="flex flex-wrap justify-center gap-6 mb-16">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3 text-zinc-100 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-sm tracking-tight">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                to="/signup"
                className="px-12 py-5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 rounded-2xl font-black text-xl text-white inline-flex items-center gap-4 shadow-2xl shadow-sky-500/20 hover-lift active:scale-95 transition-all animate-pulse-glow"
              >
                Start Free Trial
                <ArrowRight className="w-6 h-6" />
              </Link>
              <button
                type="button"
                className="px-12 py-5 glass-panel hover:bg-zinc-800/80 rounded-2xl font-bold text-xl border border-white/10 hover:border-sky-500/50 text-white transition-all hover-lift active:scale-95"
              >
                Schedule a Demo
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default CTA;