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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="group relative bg-zinc-900/40 backdrop-blur-sm rounded-2xl p-8 border border-zinc-800 hover:border-zinc-600 transition-all duration-300 hover:transform hover:scale-[1.02]"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <div className={`text-5xl font-bold mb-2 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>
                {stat.number}
              </div>
              <div className="text-xl font-semibold text-white">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;