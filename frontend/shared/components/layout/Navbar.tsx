import React from 'react';
import Link from 'next/link';

export const Navbar: React.FC = () => {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-600">
          AqarFlow
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/properties" className="text-sm font-medium text-slate-700 hover:text-blue-600">
            Properties
          </Link>
          <Link href="/about" className="text-sm font-medium text-slate-700 hover:text-blue-600">
            About
          </Link>
          <Link href="/contact" className="text-sm font-medium text-slate-700 hover:text-blue-600">
            Contact
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Agent Portal
          </Link>
        </nav>
      </div>
    </header>
  );
};
