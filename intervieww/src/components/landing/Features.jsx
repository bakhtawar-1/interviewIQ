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
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Everything You Need to <span className="text-gradient-premium">Succeed</span>
          </h2>
          <p className="text-xl text-zinc-400">Whether preparing or screening candidates</p>
        </div>

        <div className="flex justify-center mb-16">
          <div className="inline-flex glass-panel rounded-2xl p-2">
            <button
              onClick={() => setActiveTab('candidate')}
              className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 ${
                activeTab === 'candidate' ? 'bg-sky-600 text-white shadow-xl shadow-sky-500/20' : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              For Candidates
            </button>
            <button
              onClick={() => setActiveTab('recruiter')}
              className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 ${
                activeTab === 'recruiter' ? 'bg-sky-600 text-white shadow-xl shadow-sky-500/20' : 'text-zinc-500 hover:text-zinc-200'
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
              className="group glass-card p-8 rounded-3xl hover-lift shadow-xl"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                {React.cloneElement(feature.icon, { className: 'w-7 h-7 text-white' })}
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight text-white">{feature.title}</h3>
              <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Features;