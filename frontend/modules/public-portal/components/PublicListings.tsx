'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { publicPortalApi } from '../api';
import { PublicListingItem, PublicPropertyFilters, PublicFiltersData } from '../types';
import { formatPKR } from '@/shared/lib';
import { Button, Input } from '@/shared/components/ui';

const API_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

function resolveImageUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${API_SERVER_URL}${url}`;
}

export const PublicListings: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filterOptions, setFilterOptions] = useState<PublicFiltersData>({
    cities: [],
    types: [],
  });

  const [filters, setFilters] = useState<PublicPropertyFilters>({
    purpose: searchParams.get('purpose') || '',
    type: searchParams.get('type') || '',
    city: searchParams.get('city') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    bedrooms: searchParams.get('bedrooms') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: 12,
  });

  const [listings, setListings] = useState<PublicListingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load distinct filter values
  useEffect(() => {
    publicPortalApi
      .getFilters()
      .then((res) => {
        if (res?.data) {
          setFilterOptions(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch properties whenever filters change
  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await publicPortalApi.getProperties(filters);
      if (res?.data) {
        setListings(res.data.items || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Sync state to URL
  const updateFilter = (newValues: Partial<PublicPropertyFilters>) => {
    const updated = { ...filters, ...newValues, page: newValues.page !== undefined ? newValues.page : 1 };
    setFilters(updated);

    const params = new URLSearchParams();
    if (updated.purpose) params.set('purpose', updated.purpose);
    if (updated.type) params.set('type', updated.type);
    if (updated.city) params.set('city', updated.city);
    if (updated.minPrice) params.set('minPrice', String(updated.minPrice));
    if (updated.maxPrice) params.set('maxPrice', String(updated.maxPrice));
    if (updated.bedrooms) params.set('bedrooms', String(updated.bedrooms));
    if (updated.search) params.set('search', updated.search);
    if (updated.sort && updated.sort !== 'newest') params.set('sort', updated.sort);
    if (updated.page && updated.page > 1) params.set('page', String(updated.page));

    const queryStr = params.toString();
    router.replace(`/properties${queryStr ? `?${queryStr}` : ''}`, { scroll: false });
  };

  const handleReset = () => {
    const resetFilters: PublicPropertyFilters = {
      purpose: '',
      type: '',
      city: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      search: '',
      sort: 'newest',
      page: 1,
      limit: 12,
    };
    setFilters(resetFilters);
    router.replace('/properties', { scroll: false });
  };

  return (
    <div className="space-y-8">
      {/* Search and Filters Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Explore Properties</h2>
            <p className="text-sm text-slate-500">Discover verified properties for sale and rent in Pakistan</p>
          </div>

          {/* Quick Purpose Filter Pills */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
            {[
              { label: 'All', value: '' },
              { label: 'Buy', value: 'SALE' },
              { label: 'Rent', value: 'RENT' },
              { label: 'Lease', value: 'LEASE' },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => updateFilter({ purpose: p.value })}
                className={`px-3.5 py-1.5 rounded-md transition ${
                  filters.purpose === p.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
          {/* Search text */}
          <div className="lg:col-span-2">
            <Input
              placeholder="Search by title, locality or sector..."
              value={filters.search || ''}
              onChange={(e) => updateFilter({ search: e.target.value })}
            />
          </div>

          {/* City select */}
          <div>
            <select
              aria-label="Filter by city"
              value={filters.city || ''}
              onChange={(e) => updateFilter({ city: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Cities</option>
              {filterOptions.cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Property Type select */}
          <div>
            <select
              aria-label="Filter by property type"
              value={filters.type || ''}
              onChange={(e) => updateFilter({ type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {filterOptions.types.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Sort order */}
          <div>
            <select
              aria-label="Sort properties"
              value={filters.sort || 'newest'}
              onChange={(e) => updateFilter({ sort: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Second Row: Price range & Beds */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 pt-1">
          <div>
            <Input
              type="number"
              min="0"
              placeholder="Min Price (PKR)"
              value={filters.minPrice || ''}
              onChange={(e) => updateFilter({ minPrice: e.target.value })}
            />
          </div>
          <div>
            <Input
              type="number"
              min="0"
              placeholder="Max Price (PKR)"
              value={filters.maxPrice || ''}
              onChange={(e) => updateFilter({ maxPrice: e.target.value })}
            />
          </div>
          <div>
            <select
              aria-label="Filter by bedrooms"
              value={filters.bedrooms || ''}
              onChange={(e) => updateFilter({ bedrooms: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any Bedrooms</option>
              <option value="1">1+ Bedrooms</option>
              <option value="2">2+ Bedrooms</option>
              <option value="3">3+ Bedrooms</option>
              <option value="4">4+ Bedrooms</option>
              <option value="5">5+ Bedrooms</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="secondary" onClick={handleReset} className="w-full text-xs">
              Reset Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-sm text-slate-600 px-1">
        <div>
          Showing <span className="font-semibold text-slate-900">{listings.length}</span> of{' '}
          <span className="font-semibold text-slate-900">{total}</span> properties
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Property Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse bg-white border border-slate-200 rounded-2xl h-80 overflow-hidden">
              <div className="h-48 bg-slate-200" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-5 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl">
          <div className="text-4xl mb-3">🏡</div>
          <h3 className="text-lg font-bold text-slate-800">No properties found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria, price range, or city filter to view available properties.
          </p>
          <Button variant="secondary" size="sm" onClick={handleReset} className="mt-4">
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => {
            const coverImage = item.primaryImage || item.images[0];
            const coverUrl = resolveImageUrl(coverImage?.url);

            return (
              <Link
                key={item.id}
                href={`/properties/${item.id}`}
                data-testid="property-card"
                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col"
              >
                {/* Photo & Badges */}
                <div className="relative h-52 bg-slate-100 overflow-hidden">
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100 text-sm">
                      No photo available
                    </div>
                  )}

                  {/* Purpose & Type badge */}
                  <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-600 text-white shadow-sm">
                      {item.purpose === 'SALE' ? 'For Sale' : item.purpose === 'RENT' ? 'For Rent' : 'For Lease'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur text-slate-800 shadow-sm">
                      {item.type}
                    </span>
                  </div>

                  {item.images && item.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur">
                      📷 {item.images.length}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-xs font-mono text-slate-400 mb-1">{item.referenceCode}</div>
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition truncate">
                      {item.title}
                    </h3>
                    <div className="text-xl font-extrabold text-blue-600 mt-1">
                      {formatPKR(item.price)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center">
                      <span>📍</span>
                      <span className="ml-1 truncate">
                        {item.locality ? `${item.locality}, ` : ''}
                        {item.city || 'Pakistan'}
                      </span>
                    </div>
                  </div>

                  {/* Facts Strip */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                    {item.bedrooms !== null && item.bedrooms !== undefined && (
                      <span>🛏️ {item.bedrooms} {item.bedrooms === 1 ? 'Bed' : 'Beds'}</span>
                    )}
                    {item.bathrooms !== null && item.bathrooms !== undefined && (
                      <span>🚿 {item.bathrooms} {item.bathrooms === 1 ? 'Bath' : 'Baths'}</span>
                    )}
                    <span>
                      📐 {Number(item.areaValue).toLocaleString()} {item.areaUnit}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-3 pt-6 border-t border-slate-100">
          <Button
            variant="secondary"
            size="sm"
            disabled={filters.page === 1}
            onClick={() => updateFilter({ page: (filters.page || 1) - 1 })}
          >
            &larr; Previous
          </Button>
          <span className="text-sm font-medium text-slate-600">
            Page {filters.page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={filters.page === totalPages}
            onClick={() => updateFilter({ page: (filters.page || 1) + 1 })}
          >
            Next &rarr;
          </Button>
        </div>
      )}
    </div>
  );
};
