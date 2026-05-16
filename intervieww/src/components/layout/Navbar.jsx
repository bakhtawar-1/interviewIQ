import React, { useState, useEffect } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'About', href: '#about' },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled
          ? 'glass-navbar shadow-2xl shadow-black/40'
          : 'bg-transparent'
      }`}
    >

      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 flex items-center justify-center group-hover:rotate-6 transition-transform shadow-lg shadow-sky-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-zinc-100 via-sky-200 to-sky-400 bg-clip-text text-transparent">
              InterviewIQ
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="relative text-gray-300 hover:text-white transition-colors group"
              >
                {link.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-sky-500 group-hover:w-full transition-all duration-300"></span>
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <Link
              to="/signup"
              state={{ defaultRole: 'recruiter' }}
              className="text-sm text-zinc-400 hover:text-sky-300 transition-colors"
            >
              Hiring?
            </Link>
            <Link
              to="/signin"
              className="px-6 py-2.5 bg-zinc-900/70 hover:bg-zinc-800 rounded-xl transition-all border border-zinc-600 hover:border-sky-500/35 font-medium text-zinc-100"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 rounded-xl font-bold text-white transition-all shadow-lg shadow-sky-900/30 animate-pulse-glow"
            >
              Get Started
            </Link>
          </div>

          <button
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden mt-6 pb-6 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block py-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <div className="pt-4 space-y-3">
              <Link
                to="/signup"
                state={{ defaultRole: 'recruiter' }}
                className="block text-center px-6 py-3 text-sky-300 border border-sky-500/30 rounded-xl"
              >
                Hiring? Recruiter signup
              </Link>
              <Link
                to="/signin"
                className="block text-center px-6 py-3 bg-zinc-900/70 hover:bg-zinc-800 rounded-xl transition-all border border-zinc-600"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="block text-center px-6 py-3 bg-sky-600 hover:bg-sky-500 rounded-xl font-semibold text-white"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;