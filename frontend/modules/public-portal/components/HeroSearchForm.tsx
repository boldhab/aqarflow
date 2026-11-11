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

  useEffect(() => {
    publicPortalApi
      .getFilters()
      .then((res) => {
        if (res?.data) {
          setCities(res.data.cities || []);
          setTypes(res.data.types || []);
        }
      })
      .catch(() => {});
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
    <div className="w-full max-w-4xl mx-auto bg-white/95 backdrop-blur-md p-4 sm:p-6 rounded-2xl shadow-2xl border border-white/20 text-slate-800">
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
            onClick={() => setPurpose(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
              purpose === tab.value
                ? 'bg-blue-600 text-white shadow-md'
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
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            City
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Property Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="">All Types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Max Budget (PKR)
          </label>
          <input
            type="number"
            min="0"
            step="100000"
            placeholder="e.g. 50000000"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end">
          <Button type="submit" variant="primary" className="w-full h-[38px] font-bold shadow-md">
            Search Properties
          </Button>
        </div>
      </form>
    </div>
  );
};
