import React from 'react';
import { InquiryForm } from '@/modules/public-portal';

export default function ContactPage() {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Contact Agency</h1>
        <p className="text-slate-600 mt-1">Get in touch with an agent regarding any inquiry.</p>
      </div>
      <InquiryForm agencyId="demo-agency" />
    </div>
  );
}
