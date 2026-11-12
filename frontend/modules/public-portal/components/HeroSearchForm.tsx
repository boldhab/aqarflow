'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { publicPortalApi } from '../api';
import { Button } from '@/shared/components/ui';

export const HeroSearchForm: React.FC = () => {
  const router = useRouter();
  const [purpose, setPurpose] = useState('SALE');
  const [city, setCity] = useState('');
  const [type, setType] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(true);

  useEffect(() => {
    publicPortalApi
      .getFilters()
      .then((res) => {
        if (res?.data) {
          setCities(res.data.cities || []);
          setTypes(res.data.types || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingFilters(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (purpose) params.set('purpose', purpose);
    if (city) params.set('city', city);
    if (type) params.set('type', type);
    if (maxPrice) params.set('maxPrice', maxPrice);

    router.push(`/properties?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/95 backdrop-blur-md p-4 sm:p-6 rounded-3xl shadow-2xl border border-white/20 text-slate-800">
      {/* Purpose Tabs */}
      <div className="flex space-x-2 border-b border-slate-200/80 pb-3 mb-4">
        {[
          { label: 'Buy', value: 'SALE' },
          { label: 'Rent', value: 'RENT' },
          { label: 'Lease', value: 'LEASE' },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={purpose === tab.value}
            onClick={() => setPurpose(tab.value)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              purpose === tab.value
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form Fields Grid */}
      <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div>
          <label htmlFor="hero-city" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            City
          </label>
          <div className="relative">
            <select
              id="hero-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3.5 py-2.5 pr-8 border rounded-xl text-sm bg-white border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 font-medium text-slate-800 appearance-none cursor-pointer"
            >
              <option value="">All Cities</option>
              {loadingFilters && cities.length === 0 ? (
                <option disabled>Loading cities...</option>
              ) : (
                cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="hero-type" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Property Type
          </label>
          <div className="relative">
            <select
              id="hero-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3.5 py-2.5 pr-8 border rounded-xl text-sm bg-white border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 font-medium text-slate-800 appearance-none cursor-pointer"
            >
              <option value="">All Types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t.toLowerCase().replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="hero-budget" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Max Budget (PKR)
          </label>
          <input
            type="number"
            min="0"
            step="100000"
            placeholder="e.g. 50,000,000"
            id="hero-budget"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full px-3.5 py-2.5 border rounded-xl text-sm bg-white border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 font-medium text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-end">
          <Button
            type="submit"
            variant="primary"
            className="w-full h-[42px] font-bold shadow-md hover:shadow-lg transition-all rounded-xl"
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            }
          >
            Find Properties
          </Button>
        </div>
      </form>
    </div>
  );
};
