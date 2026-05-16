import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Brain, TrendingUp, ArrowRight } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      icon: <UserPlus className="w-8 h-8" />,
      title: "Sign Up & Choose Your Path",
      description: "Create account and select candidate or recruiter mode",
      color: "from-sky-500 to-sky-700"
    },
    {
      number: "02",
      icon: <Brain className="w-8 h-8" />,
      title: "AI Analyzes & Adapts",
      description: "Our AI evaluates responses and adjusts dynamically",
      color: "from-slate-600 to-slate-800"
    },
    {
      number: "03",
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Track Progress & Excel",
      description: "Access detailed analytics and recommendations",
      color: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <section id="how-it-works" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
            Get Started in <span className="text-gradient-premium">3 Easy Steps</span>
          </h2>
          <p className="text-xl text-zinc-500 font-medium">From signup to career success</p>
        </div>

        <div className="grid md:grid-cols-3 gap-16">
          {steps.map((step, idx) => (
            <div key={idx} className="text-center group">
              <div className="relative mb-10">
                <div className={`text-8xl font-black bg-gradient-to-br ${step.color} bg-clip-text text-transparent opacity-10 absolute -top-10 left-1/2 -translate-x-1/2 select-none group-hover:scale-110 transition-transform duration-700`}>
                  {step.number}
                </div>
                <div className={`w-24 h-24 bg-gradient-to-br ${step.color} rounded-[2rem] flex items-center justify-center mx-auto relative z-10 shadow-2xl group-hover:rotate-6 transition-transform duration-500`}>
                  {React.cloneElement(step.icon, { className: 'w-10 h-10 text-white' })}
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight text-white">{step.title}</h3>
              <p className="text-zinc-400 text-lg leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-24 text-center">
          <Link
            to="/signup"
            className="px-10 py-5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 rounded-2xl font-black text-xl text-white inline-flex items-center gap-4 shadow-2xl shadow-sky-500/20 hover-lift active:scale-95 transition-all animate-pulse-glow"
          >
            Start your journey
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;