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
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Get Started in <span className="text-gradient">3 Easy Steps</span>
          </h2>
          <p className="text-xl text-zinc-400">From signup to success</p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, idx) => (
            <div key={idx} className="text-center">
              <div className={`text-7xl font-bold bg-gradient-to-br ${step.color} bg-clip-text text-transparent opacity-30 mb-6`}>
                {step.number}
              </div>
              <div className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-3xl flex items-center justify-center mx-auto mb-6`}>
                {step.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
              <p className="text-zinc-400 text-lg">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <Link
            to="/signup"
            className="px-8 py-4 bg-sky-600 hover:bg-sky-500 rounded-2xl font-semibold text-lg transition-all inline-flex items-center gap-3 text-white shadow-lg shadow-sky-950/30"
          >
            Start your journey
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;