import React from 'react';
import { InquiryForm } from '@/modules/public-portal';

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <div className="h-72 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400">
          Property Media Gallery Placeholder (ID: {id})
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Property Details</h1>
        <p className="text-slate-600">
          Spacious luxury property with modern amenities and high-end finishes.
        </p>
      </div>
      <div>
        <InquiryForm agencyId="demo-agency" propertyId={id} />
      </div>
    </div>
  );
}
