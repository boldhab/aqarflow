import React from 'react';
import Link from 'next/link';
import { PublicListings } from '@/modules/public-portal';

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="text-center py-12 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl shadow-lg">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Find Your Next Property with AqarFlow
        </h1>
        <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
          Explore exclusive residential and commercial real estate listings managed by leading agencies.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/properties"
            className="px-6 py-3 bg-white text-blue-700 font-bold rounded-lg shadow hover:bg-blue-50 transition"
          >
            Browse Listings
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 border border-white text-white font-bold rounded-lg hover:bg-white/10 transition"
          >
            Contact Agencies
          </Link>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">Featured Properties</h2>
          <Link href="/properties" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
            View All &rarr;
          </Link>
        </div>
        <PublicListings />
      </section>
    </div>
  );
}
