import React from 'react';
import Link from 'next/link';
import { ClipboardList, Users, Banknote, MessageCircle } from 'lucide-react';

export const metadata = {
  title: 'About Us | AqarFlow Real Estate Platform',
  description: 'Learn about AqarFlow, a real estate platform and agency management software.',
};

const STATS = [
  { value: 'Details', label: 'Property information', color: 'text-brand-600', bg: 'bg-brand-50 border-brand-100' },
  { value: 'Search', label: 'Location filters', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
  { value: 'Direct', label: 'Agent inquiries', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
  { value: 'PKR', label: 'Transparent Pricing', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
];

const VALUES = [
  { icon: ClipboardList, title: 'Detailed Listings', desc: 'Review location, pricing, and property details before contacting an agent.' },
  { icon: Users, title: 'Agency Professionals', desc: 'Connect directly with agents who understand their local market.' },
  { icon: Banknote, title: 'Transparent Pricing', desc: 'Compare asking prices in PKR and discuss terms directly with the agency.' },
  { icon: MessageCircle, title: 'Fast Response', desc: 'Send an inquiry directly from a listing or contact the agency.' },
];

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">About AqarFlow</div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Find property with clarity and confidence</h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">Modern real estate operations and public property listings across Lahore, Karachi, and Islamabad.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-card">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Our Mission</h2>
          <p className="text-slate-600 text-sm leading-relaxed">AqarFlow bridges the gap between prospective buyers, renters, and trusted real estate agencies. Our platform connects listings with agency professionals who understand the local market dynamics in Lahore, Karachi, and Islamabad.</p>
          <p className="text-slate-600 text-sm leading-relaxed">Our comprehensive portal provides transparent pricing in PKR, property imagery, and seamless inquiry routing so you never miss out on your next home or commercial investment.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {STATS.map((stat) => (
            <div key={stat.label} className={`border p-5 rounded-2xl text-center space-y-1 ${stat.bg}`}>
              <span className={`text-3xl font-extrabold block ${stat.color}`}>{stat.value}</span>
              <span className="text-xs font-semibold text-slate-700">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 text-center">Why Choose AqarFlow</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {VALUES.map((v) => (
            <div key={v.title} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="text-brand-600"><v.icon size={30} aria-hidden="true"/></div>
              <h3 className="font-bold text-slate-900 text-sm">{v.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="text-center pt-4">
        <Link href="/properties" className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-600 text-white font-bold rounded-xl shadow-md hover:bg-brand-700 transition-colors text-sm">
          Explore Available Properties
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>
        </Link>
      </div>
    </div>
  );
}
