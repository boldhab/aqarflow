import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { InquiryForm, PropertyGallery } from '@/modules/public-portal';
import { PublicListingDetail } from '@/modules/public-portal/types';
import { formatPKR } from '@/shared/lib';

const API_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

async function fetchProperty(id: string): Promise<PublicListingDetail | null> {
  try {
    const res = await fetch(`${API_SERVER_URL}/api/v1/public/properties/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return data.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const property = await fetchProperty(id);

  if (!property) {
    return {
      title: 'Property Not Found | AqarFlow',
      description: 'The requested property could not be found.',
    };
  }

  const primaryUrl = property.primaryImage?.url || property.images[0]?.url;
  const fullImageUrl = primaryUrl
    ? primaryUrl.startsWith('http')
      ? primaryUrl
      : `${API_SERVER_URL}${primaryUrl}`
    : undefined;

  return {
    title: `${property.title} | ${property.referenceCode} - AqarFlow`,
    description: property.description || `View details for ${property.title} located in ${property.city || 'Pakistan'}.`,
    openGraph: {
      title: `${property.title} - ${formatPKR(property.price)}`,
      description: property.description || `${property.type} for ${property.purpose.toLowerCase()}`,
      images: fullImageUrl ? [{ url: fullImageUrl }] : [],
    },
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await fetchProperty(id);

  if (!property) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Breadcrumbs Navigation */}
      <nav className="flex items-center space-x-2 text-xs sm:text-sm text-slate-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-600 transition">
          Home
        </Link>
        <span>/</span>
        <Link href="/properties" className="hover:text-brand-600 transition">
          Properties
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium truncate max-w-xs">{property.title}</span>
      </nav>

      {/* Main Title & Key Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div className="space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-600 text-white shadow-sm">
              {property.purpose === 'SALE' ? 'For Sale' : property.purpose === 'RENT' ? 'For Rent' : 'For Lease'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
              {property.type}
            </span>
            <span className="text-xs font-mono text-slate-500 font-semibold px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
              Ref: {property.referenceCode}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {property.title}
          </h1>

          <p className="text-slate-500 text-sm flex items-center gap-1.5">
            <span>📍</span>
            <span>
              {[property.address, property.locality, property.city, 'Pakistan']
                .filter(Boolean)
                .join(', ')}
            </span>
          </p>
        </div>

        <div className="text-left md:text-right flex-shrink-0 bg-brand-50/60 border border-brand-100 p-4 rounded-2xl md:bg-transparent md:border-0 md:p-0">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-bold block mb-0.5">
            Asking Price
          </span>
          <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-brand-600 tracking-tight">
            {formatPKR(property.price)}
          </span>
        </div>
      </div>

      {/* 2-Column Grid: Left Content (Gallery & Details), Right Content (Inquiry Form) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Gallery, Facts, Description, Agent Box */}
        <div className="lg:col-span-2 space-y-8">
          {/* Gallery */}
          <PropertyGallery title={property.title} images={property.images} />

          {/* Key Overview Facts */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4">
            <h3 className="text-base font-bold text-slate-900">Property Overview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              {property.bedrooms !== null && property.bedrooms !== undefined && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-400 block mb-1">Bedrooms</span>
                  <span className="text-base font-bold text-slate-900">🛏️ {property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms !== null && property.bathrooms !== undefined && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-400 block mb-1">Bathrooms</span>
                  <span className="text-base font-bold text-slate-900">🚿 {property.bathrooms}</span>
                </div>
              )}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-400 block mb-1">Area</span>
                <span className="text-base font-bold text-slate-900">
                  📐 {Number(property.areaValue).toLocaleString()} {property.areaUnit}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-400 block mb-1">Availability</span>
                <span className="text-base font-bold text-slate-900 capitalize">
                  {property.status.toLowerCase().replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-3">
              <h3 className="text-base font-bold text-slate-900">About This Property</h3>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                {property.description}
              </p>
            </div>
          )}

          {/* Contact Agent / Agency Info Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4">
            <h3 className="text-base font-bold text-slate-900">Listed By</h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-5 rounded-xl border border-slate-100">
              <div className="space-y-1">
                <div className="font-bold text-slate-900 text-base">
                  {property.assignedAgent ? property.assignedAgent.name : property.agency.name}
                </div>
                <div className="text-xs text-slate-500">
                  Agency: <strong className="text-slate-700 font-semibold">{property.agency.name}</strong>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                {property.assignedAgent?.phone && (
                  <div className="text-slate-600">
                    Agent Phone: <strong className="font-mono text-slate-900">{property.assignedAgent.phone}</strong>
                  </div>
                )}
                {property.agency.phone && (
                  <div className="text-slate-600">
                    Office Phone: <strong className="font-mono text-slate-900">{property.agency.phone}</strong>
                  </div>
                )}
                {property.agency.email && (
                  <div className="text-slate-600">
                    Office Email: <strong className="text-slate-900">{property.agency.email}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Inquiry Form */}
        <div className="lg:sticky lg:top-24">
          <InquiryForm propertyId={property.id} propertyTitle={property.title} />
        </div>
      </div>
    </div>
  );
}
