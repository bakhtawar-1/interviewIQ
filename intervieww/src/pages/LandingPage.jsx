import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Hero from '../components/landing/Hero';
import Stats from '../components/landing/Stats';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import CTA from '../components/landing/CTA';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased scrollbar-refined selection:bg-sky-500/30">
      {/* Background Layer */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 scale-105"
          style={{ backgroundImage: 'url("/assets/hero-bg.png")' }}
        />
        <div className="absolute inset-0 bg-mesh opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.2),transparent_70%)]" />
        <div className="absolute inset-0 bg-zinc-950/20" />
      </div>

      <div className="relative z-10">
        <Navbar />
        <main className="space-y-0">
          <div className="animate-fade-in-up">
            <Hero />
          </div>
          <div className="animate-fade-in-up animate-delay-100">
            <Stats />
          </div>
          <div className="animate-fade-in-up animate-delay-200">
            <Features />
          </div>
          <div className="animate-fade-in-up animate-delay-300">
            <HowItWorks />
          </div>
          <div className="animate-fade-in-up">
            <CTA />
          </div>
        </main>
        <Footer />
      </div>
    </div>


  );
};

export default LandingPage;