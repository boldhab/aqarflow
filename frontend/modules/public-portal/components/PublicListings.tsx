'use client';

import React from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/shared/lib';
import { usePublicListings } from '../hooks';

export const PublicListings: React.FC = () => {
  const { listings, loading, error } = usePublicListings();

  if (loading) return <div className="p-8 text-center text-slate-500">Loading available listings...</div>;
  if (error) return <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.length === 0 ? (
        <div className="col-span-full py-12 text-center text-slate-400">
          No published properties available at the moment.
        </div>
      ) : (
        listings.map((item) => (
          <div
            key={item.id}
            className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition bg-white"
          >
            <div className="h-48 bg-slate-100 flex items-center justify-center text-slate-400">
              {item.images[0]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.images[0].url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>No Image</span>
              )}
            </div>
            <div className="p-5 space-y-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                {item.type}
              </span>
              <h3 className="font-bold text-lg text-slate-900 truncate">{item.title}</h3>
              <p className="text-blue-600 font-bold text-xl">
                {formatCurrency(item.price, item.currency)}
              </p>
              <p className="text-sm text-slate-500">{item.city || 'Location unlisted'}</p>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                <span>By: {item.agency.name}</span>
                <Link
                  href={`/properties/${item.id}`}
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  View Details &rarr;
                </Link>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
