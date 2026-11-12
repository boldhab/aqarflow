import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { InquiryForm, PropertyGallery } from '@/modules/public-portal';
import { PublicListingDetail } from '@/modules/public-portal/types';
import { BedDouble, Bath, Ruler } from 'lucide-react';
import { formatPKR } from '@/shared/lib';

const API_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

async function fetchProperty(id: string): Promise<PublicListingDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const res = await fetch(`${API_SERVER_URL}/api/v1/public/properties/${id}`, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Property service is temporarily unavailable');
  const data = await res.json();
  return data.data || null;
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

  const agentName = property.assignedAgent ? property.assignedAgent.name : property.agency.name;
  const agentInitial = agentName.charAt(0).toUpperCase();

  return (
    <div className="pb-24 lg:pb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Breadcrumbs Navigation */}
      <nav className="flex items-center space-x-2 text-xs sm:text-sm text-slate-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-600 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/properties" className="hover:text-brand-600 transition-colors">
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
              {property.type.replace(/_/g, ' ')}
            </span>
            <span className="text-xs font-mono text-slate-500 font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200">
              Ref: {property.referenceCode}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {property.title}
          </h1>

          <p className="text-slate-500 text-sm flex items-center gap-1.5">
            <svg className="h-4 w-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span>
              {[property.address, property.locality, property.city, 'Pakistan']
                .filter(Boolean)
                .join(', ')}
            </span>
          </p>
        </div>

        <div className="text-left md:text-right flex-shrink-0 bg-brand-50/70 border border-brand-100 p-4 rounded-2xl md:bg-transparent md:border-0 md:p-0">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-bold block mb-1">
            Asking Price
          </span>
          <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-brand-600 tracking-tight">
            {formatPKR(property.price)}
          </span>
          {property.purpose !== 'SALE' && <p className="text-xs text-slate-600 mt-2">Confirm {property.purpose.toLowerCase()} payment period with agent</p>}
        </div>
      </div>

      {/* 2-Column Grid: Left Content (Gallery & Details), Right Content (Inquiry Form) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Gallery, Facts, Description, Agent Box */}
        <div className="lg:col-span-2 space-y-8">
          {/* Gallery */}
          <PropertyGallery title={property.title} images={[...property.images].sort((a,b)=>Number(b.isPrimary)-Number(a.isPrimary)||a.sortOrder-b.sortOrder)} />

          {/* Key Overview Facts */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4">
            <h3 className="text-base font-bold text-slate-900">Property Overview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              {property.bedrooms !== null && property.bedrooms !== undefined && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 block mb-1">Bedrooms</span>
                  <span className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <BedDouble size={18} aria-hidden="true"/> {property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}
                  </span>
                </div>
              )}
              {property.bathrooms !== null && property.bathrooms !== undefined && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 block mb-1">Bathrooms</span>
                  <span className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <Bath size={18} aria-hidden="true"/> {property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}
                  </span>
                </div>
              )}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">Area</span>
                <span className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <Ruler size={18} aria-hidden="true"/> {Number(property.areaValue).toLocaleString()} {property.areaUnit}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">Availability</span>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/80 p-5 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 font-bold text-lg flex items-center justify-center flex-shrink-0">
                  {agentInitial}
                </div>
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 text-base">
                    {agentName}
                  </div>
                  <div className="text-xs text-slate-500">
                    Agency:{' '}
                    <strong className="text-slate-700 font-semibold">{property.agency.name}</strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-col gap-2 text-xs">
                {property.assignedAgent?.phone && (
                  <a
                    href={`tel:${property.assignedAgent.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:text-brand-600 hover:border-brand-300 font-medium transition-colors"
                  >
                    <svg className="h-3.5 w-3.5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    <span>{property.assignedAgent.phone}</span>
                  </a>
                )}
                {property.agency.phone && !property.assignedAgent?.phone && (
                  <a
                    href={`tel:${property.agency.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:text-brand-600 hover:border-brand-300 font-medium transition-colors"
                  >
                    <svg className="h-3.5 w-3.5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    <span>{property.agency.phone}</span>
                  </a>
                )}
                {property.agency.email && (
                  <a
                    href={`mailto:${property.agency.email}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:text-brand-600 hover:border-brand-300 font-medium transition-colors"
                  >
                    <svg className="h-3.5 w-3.5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    <span>{property.agency.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Inquiry Form */}
        <div className="lg:sticky lg:top-24">
          <div id="property-inquiry" className="scroll-mt-24"><InquiryForm propertyId={property.id} propertyTitle={property.title} /></div>
        </div>
      </div>
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t bg-white/95 backdrop-blur p-3 flex gap-3 shadow-lg" style={{paddingBottom:'max(12px, env(safe-area-inset-bottom))'}}>
        {(property.assignedAgent?.phone || property.agency.phone) && <a href={`tel:${property.assignedAgent?.phone || property.agency.phone}`} className="flex-1 rounded-xl border border-brand-200 py-3 text-center font-semibold text-brand-700">Call Agent</a>}
        <a href="#property-inquiry" className="flex-1 rounded-xl bg-brand-600 text-white py-3 text-center font-semibold">Inquire</a>
      </div>
    </div>
  );
}
