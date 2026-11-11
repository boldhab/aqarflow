import React from 'react';
import Link from 'next/link';
import { HeroSearchForm } from '@/modules/public-portal';
import { PublicListingItem } from '@/modules/public-portal/types';
import { formatPKR } from '@/shared/lib';

const API_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

function resolveImageUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_SERVER_URL}${url}`;
}

async function getFeaturedProperties(): Promise<PublicListingItem[]> {
  try {
    const res = await fetch(`${API_SERVER_URL}/api/v1/public/properties?limit=6&sort=newest`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.items || [];
  } catch {
    return [];
  }
}

const categories = [
  { title: 'Apartments', type: 'APARTMENT', icon: '🏢', desc: 'High-rise flats & luxury suites' },
  { title: 'Houses & Villas', type: 'HOUSE', icon: '🏡', desc: 'Spacious independent residences' },
  { title: 'Commercial', type: 'OFFICE', icon: '💼', desc: 'Corporate HQ & retail spaces' },
  { title: 'Plots & Land', type: 'PLOT', icon: '📐', desc: 'Prime residential & commercial sectors' },
];

const stats = [
  { label: 'Verified Listings', value: '500+' },
  { label: 'Cities Covered', value: '3+' },
  { label: 'Licensed Agents', value: '50+' },
  { label: 'Deals Closed', value: '1,200+' },
];

export default async function HomePage() {
  const featuredProperties = await getFeaturedProperties();

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-900 to-indigo-950 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-200 border border-brand-400/30">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" aria-hidden="true" />
              Pakistan&apos;s Leading Real Estate Platform
            </span>
          </div>
          <div className="text-center max-w-4xl mx-auto mb-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-4">
              Find Your Dream{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-sky-300">Property</span>{' '}
              in Pakistan
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Browse verified listings across Lahore, Karachi, and Islamabad with transparent pricing and direct agent support.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <HeroSearchForm />
          </div>
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-extrabold text-white">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {/* Categories */}
        <section aria-labelledby="categories-heading">
          <div className="text-center mb-10">
            <h2 id="categories-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Explore by Property Type</h2>
            <p className="mt-2 text-slate-500 text-sm max-w-md mx-auto">Select a category to find properties tailored to your lifestyle</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.type}
                href={`/properties?type=${cat.type}`}
                className="group bg-white rounded-2xl border border-slate-200 p-6 hover:border-brand-400 hover:shadow-card-hover transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
              >
                <div className="text-3xl mb-3">{cat.icon}</div>
                <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors text-sm sm:text-base">{cat.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{cat.desc}</p>
                <div className="mt-4 flex items-center text-xs font-semibold text-brand-600 group-hover:translate-x-1 transition-transform">Browse &rarr;</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Properties */}
        <section aria-labelledby="featured-heading">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 id="featured-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Featured Properties</h2>
              <p className="mt-1 text-sm text-slate-500">Hand-picked verified listings available for immediate occupancy</p>
            </div>
            <Link href="/properties" className="flex-shrink-0 text-sm font-semibold text-brand-600 hover:text-brand-800 transition-colors">
              View all &rarr;
            </Link>
          </div>
          {featuredProperties.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <div className="text-4xl mb-3">🏡</div>
              <p className="text-slate-500 text-sm">No featured properties at the moment.</p>
              <Link href="/properties" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-800">Browse all listings &rarr;</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((prop) => {
                const coverImg = prop.primaryImage || prop.images[0];
                const coverUrl = resolveImageUrl(coverImg?.url);
                return (
                  <Link
                    key={prop.id}
                    href={`/properties/${prop.id}`}
                    className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-card-hover hover:border-brand-200 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none flex flex-col"
                  >
                    <div className="relative h-52 bg-slate-100 overflow-hidden flex-shrink-0">
                      {coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coverUrl} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21l6.75-6.75 1.5 1.5M21 3l-9 9M3.75 9h.008v.008H3.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                          <span className="text-xs">No photo</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-600 text-white shadow-sm">
                          {prop.purpose === 'SALE' ? 'For Sale' : prop.purpose === 'RENT' ? 'For Rent' : 'For Lease'}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex-1">
                        <div className="text-xs font-mono text-slate-400 mb-1">{prop.referenceCode}</div>
                        <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 leading-snug">{prop.title}</h3>
                        <div className="text-xl font-extrabold text-brand-600 mt-2">{formatPKR(prop.price)}</div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1.5">
                          <svg className="h-3 w-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" /></svg>
                          <span className="truncate">{[prop.locality, prop.city].filter(Boolean).join(', ') || 'Pakistan'}</span>
                        </div>
                      </div>
                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-600 font-medium">
                        {prop.bedrooms != null && <span>🛏️ {prop.bedrooms}</span>}
                        {prop.bathrooms != null && <span>🚿 {prop.bathrooms}</span>}
                        <span className="ml-auto">📐 {Number(prop.areaValue).toLocaleString()} {prop.areaUnit}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* CTA Banner */}
        <section className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl overflow-hidden">
          <div className="relative px-8 sm:px-12 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
            </div>
            <div className="relative text-center md:text-left space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Ready to Buy, Rent, or Sell?</h2>
              <p className="text-brand-100 text-sm sm:text-base max-w-md">Our expert advisors and licensed agents guide you through every step of your real estate journey.</p>
            </div>
            <div className="relative flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <Link href="/contact" className="px-6 py-3 rounded-xl font-bold bg-white text-brand-700 hover:bg-brand-50 text-center shadow-lg transition-colors text-sm">Get in Touch</Link>
              <Link href="/properties" className="px-6 py-3 rounded-xl font-bold border-2 border-white/40 text-white hover:bg-white/10 text-center transition-colors text-sm">Browse Listings</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
