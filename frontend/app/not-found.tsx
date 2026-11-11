import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>
      <div className="text-5xl sm:text-6xl font-black text-slate-200 mb-2" aria-hidden="true">404</div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Page Not Found</h1>
      <p className="text-sm text-slate-600 max-w-md mb-8">Sorry, the property or page you&apos;re looking for doesn&apos;t exist or may have been unpublished.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/properties" className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white font-bold rounded-xl shadow-sm hover:bg-brand-700 transition-colors text-sm">Browse Properties</Link>
        <Link href="/" className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm">Go Home</Link>
      </div>
    </div>
  );
}
