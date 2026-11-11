import React from 'react';
import { InquiryForm } from '@/modules/public-portal';

export const metadata = {
  title: 'Contact Us | AqarFlow Real Estate Platform',
  description: 'Reach out to our real estate specialists for property inquiries, viewings, or advisory.',
};

export default function ContactPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-10 py-6">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Get in Touch
        </h1>
        <p className="text-base text-slate-600 max-w-xl mx-auto">
          Have a question about a listing or interested in property advisory? Send us an inquiry and our team will get back to you promptly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Contact info cards */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2">
            <div className="text-2xl">🏢</div>
            <h3 className="font-bold text-slate-900">Head Office</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              100 Main Boulevard, Gulberg III, Lahore, Pakistan
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2">
            <div className="text-2xl">📞</div>
            <h3 className="font-bold text-slate-900">Direct Phone</h3>
            <p className="text-xs text-slate-500 font-mono">
              +92-42-35750000 / +92-300-1112222
            </p>
            <p className="text-[11px] text-slate-400">Mon - Sat: 9:00 AM - 6:00 PM</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2">
            <div className="text-2xl">✉️</div>
            <h3 className="font-bold text-slate-900">Email Support</h3>
            <p className="text-xs text-slate-500">
              contact@demoagency.com
            </p>
          </div>
        </div>

        {/* Inquiry Form */}
        <div className="md:col-span-2">
          <InquiryForm />
        </div>
      </div>
    </div>
  );
}
