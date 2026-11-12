import React from 'react';
import { InquiryForm } from '@/modules/public-portal';

export const metadata = {
  title: 'Contact Us | AqarFlow Real Estate Platform',
  description: 'Reach out to our real estate specialists for property inquiries, viewings, or advisory.',
};

export default function ContactPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
          Get in Touch
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How Can We Help You?
        </h1>
        <p className="text-base text-slate-600 max-w-xl mx-auto">
          Have a question about a listing or looking for expert property consultation? Send an inquiry and our property team will get back to you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Contact info cards */}
        <div className="space-y-4 order-2 md:order-1">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-3">
            <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Head Office</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                100 Main Boulevard, Gulberg III
              </p>
              <p className="text-xs text-slate-600 font-medium">Lahore, Pakistan</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-3">
            <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Direct Phone</h3>
              <div className="mt-1 space-y-0.5">
                <a href="tel:+924235750000" className="text-xs text-slate-700 font-mono hover:text-brand-600 block transition-colors">
                  +92-42-35750000
                </a>
                <a href="tel:+923001112222" className="text-xs text-slate-700 font-mono hover:text-brand-600 block transition-colors">
                  +92-300-1112222
                </a>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Mon – Sat: 9:00 AM – 6:00 PM PKT</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-3">
            <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Email Support</h3>
              <a href="mailto:support@aqarflow.pk" className="text-xs text-slate-700 hover:text-brand-600 mt-1 block font-medium transition-colors">
                support@aqarflow.pk
              </a>
              <p className="text-[11px] text-slate-400 mt-1">Response during business hours</p>
            </div>
          </div>
        </div>

        {/* Inquiry Form */}
        <div className="md:col-span-2 order-1 md:order-2">
          <InquiryForm />
        </div>
      </div>
    </div>
  );
}
