import React from 'react';
import { ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const CTA = () => {
  const benefits = ["Start free for 14 days", "No credit card required", "Cancel anytime"];

  return (
    <section className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-950 to-sky-950 rounded-3xl overflow-hidden p-12 sm:p-16 text-center border border-zinc-700/80 ring-1 ring-sky-500/15">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px] opacity-60" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500/15 border border-sky-500/25 rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span className="text-sm font-medium text-sky-100/90">Limited time offer</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              Ready to transform your interview experience?
            </h2>

            <p className="text-xl text-zinc-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              Join teams and candidates using InterviewIQ to practice and hire with confidence.
            </p>

            <div className="flex flex-wrap justify-center gap-6 mb-12">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2 text-white bg-white/10 px-4 py-2 rounded-full">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span className="font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="px-10 py-5 bg-white text-sky-700 hover:bg-zinc-100 rounded-2xl font-bold text-lg inline-flex items-center gap-3 shadow-lg"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                type="button"
                className="px-10 py-5 bg-zinc-900/80 hover:bg-zinc-800 rounded-2xl font-bold text-lg border-2 border-zinc-600 hover:border-sky-500/40 text-zinc-100 transition-colors"
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