import React, { useState } from 'react';
import { Brain, Target, TrendingUp, Zap, Users, MessageSquare, Shield, Award } from 'lucide-react';

const Features = () => {
  const [activeTab, setActiveTab] = useState('candidate');

  const candidateFeatures = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered Adaptive Learning",
      description: "Questions dynamically adjust to your skill level",
      color: "from-sky-500 to-sky-700"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Real-Time Feedback",
      description: "Get instant insights on your performance",
      color: "from-slate-600 to-slate-800"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Progress Analytics",
      description: "Track improvement with detailed metrics",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Interview Simulations",
      description: "Practice with realistic scenarios",
      color: "from-orange-500 to-red-500"
    }
  ];

  const recruiterFeatures = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Automated Screening",
      description: "Save 80% of screening time",
      color: "from-sky-500 to-sky-700"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Bias-Free Evaluation",
      description: "Standardized scoring for fairness",
      color: "from-slate-600 to-slate-800"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Detailed Reports",
      description: "Comprehensive candidate profiles",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "24/7 Availability",
      description: "Candidates interview anytime",
      color: "from-orange-500 to-red-500"
    }
  ];

  const currentFeatures = activeTab === 'candidate' ? candidateFeatures : recruiterFeatures;

  return (
    <section id="features" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Everything You Need to <span className="text-gradient">Succeed</span>
          </h2>
          <p className="text-xl text-zinc-400">Whether preparing or screening candidates</p>
        </div>

        <div className="flex justify-center mb-16">
          <div className="inline-flex bg-zinc-900/60 backdrop-blur-lg rounded-2xl p-1.5 border border-zinc-700/80">
            <button
              onClick={() => setActiveTab('candidate')}
              className={`px-8 py-4 rounded-xl font-semibold transition-all ${
                activeTab === 'candidate' ? 'bg-sky-600 text-white shadow-md shadow-sky-950/25' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              For Candidates
            </button>
            <button
              onClick={() => setActiveTab('recruiter')}
              className={`px-8 py-4 rounded-xl font-semibold transition-all ${
                activeTab === 'recruiter' ? 'bg-sky-600 text-white shadow-md shadow-sky-950/25' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Target className="w-5 h-5 inline mr-2" />
              For Recruiters
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {currentFeatures.map((feature, idx) => (
            <div
              key={idx}
              className="group bg-zinc-900/40 backdrop-blur-sm rounded-2xl p-8 border border-zinc-800 hover:border-zinc-600 transition-all hover:scale-[1.02]"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-zinc-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;