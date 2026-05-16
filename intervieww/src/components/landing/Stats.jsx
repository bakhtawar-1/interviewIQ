import React from 'react';
import { TrendingUp, Users, Zap, Award } from 'lucide-react';

const Stats = () => {
  const stats = [
    {
      icon: <TrendingUp className="w-8 h-8" />,
      number: "90%+",
      label: "Accuracy Match",
      color: "from-sky-500 to-sky-700"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      number: "<2s",
      label: "Response Time",
      color: "from-slate-600 to-slate-800"
    },
    {
      icon: <Users className="w-8 h-8" />,
      number: "100+",
      label: "Concurrent Users",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Award className="w-8 h-8" />,
      number: "99%",
      label: "Uptime",
      color: "from-orange-500 to-red-500"
    }
  ];

  return (
    <section className="relative py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="group glass-card p-8 rounded-3xl hover-lift shadow-xl"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                {React.cloneElement(stat.icon, { className: 'w-8 h-8 text-white' })}
              </div>
              <div className="text-4xl font-black mb-3 text-white tracking-tight">
                {stat.number}
              </div>
              <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Stats;