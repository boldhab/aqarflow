import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-600 text-white text-xs font-black">A</span>
            <span className="font-bold text-slate-900">Aqar<span className="text-brand-600">Flow</span></span>
          </div>
          <nav className="flex items-center gap-6" aria-label="Footer navigation">
            <Link href="/properties" className="text-sm text-slate-500 hover:text-brand-600 transition-colors">Properties</Link>
            <Link href="/about" className="text-sm text-slate-500 hover:text-brand-600 transition-colors">About</Link>
            <Link href="/contact" className="text-sm text-slate-500 hover:text-brand-600 transition-colors">Contact</Link>
          </nav>
          <p className="text-xs text-slate-400">&copy; {year} AqarFlow. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
