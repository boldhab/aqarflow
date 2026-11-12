'use client';

import React, { useState } from 'react';
import { Button, Input, Alert } from '@/shared/components/ui';
import { publicPortalApi } from '../api';

export interface InquiryFormProps {
  propertyId?: string;
  propertyTitle?: string;
}

export const InquiryForm: React.FC<InquiryFormProps> = ({ propertyId, propertyTitle }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredContact, setPreferredContact] = useState<'PHONE' | 'EMAIL' | 'WHATSAPP'>('PHONE');
  const [message, setMessage] = useState('');
  const [hpName, setHpName] = useState(''); // Honeypot field (hidden from real users)

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters';
    }

    const cleanPhone = phone.trim().replace(/[\s\-().]/g, '');
    const pakPhoneRegex = /^(?:\+92|0092|92|0)?(3\d{9})$/;
    if (!cleanPhone || !pakPhoneRegex.test(cleanPhone)) {
      errs.phone = 'Enter a valid Pakistani mobile number (e.g. 0300 1234567 or +92 300 1234567)';
    }

    if (preferredContact === 'EMAIL' && !email.trim()) errs.email = 'Enter an email address so the agent can reply by email';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) { requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return; }

    try {
      setSubmitting(true);
      await publicPortalApi.submitInquiry({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        message: message.trim() || undefined,
        propertyId,
        preferredContact,
        hp_name: hpName || undefined,
      });

      setSuccess(true);
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
      setHpName('');
      setValidationErrors({});
    } catch (err: any) {
      setError(err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div role="status" aria-live="polite" className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4 animate-fade-in">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div>
          <h4 className="text-base font-bold text-emerald-950">Inquiry Received Successfully</h4>
          <p className="text-xs text-emerald-700 mt-1 max-w-sm mx-auto leading-relaxed">
            Thank you! Your inquiry has been routed to the assigned property specialist. We will reach out to you shortly.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSuccess(false)}
          className="border-emerald-300 text-emerald-800 hover:bg-emerald-100"
        >
          Send Another Inquiry
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Property inquiry form"
      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4"
    >
      <div>
        <h3 className="text-base font-bold text-slate-900">
          {propertyTitle ? 'Inquire About This Property' : 'Contact an Agent'}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Leave your details and an assigned agent will get back to you with viewing availability.
        </p>
      </div>

      {error && (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Honeypot field - invisible to humans */}
      <div style={{ display: 'none', position: 'absolute', left: '-9999px' }} aria-hidden="true">
        <label htmlFor="hp_name">Leave this empty</label>
        <input
          id="hp_name"
          type="text"
          name="hp_name"
          tabIndex={-1}
          autoComplete="off"
          value={hpName}
          onChange={(e) => setHpName(e.target.value)}
        />
      </div>

      <Input
        label="Full Name"
        autoComplete="name"
        placeholder="e.g. Tariq Mansoor"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={validationErrors.name}
        required
      />

      <Input
        label="Mobile Phone"
        type="tel"
        autoComplete="tel"
        placeholder="e.g. 0300 1234567"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        error={validationErrors.phone}
        hint="Pakistani mobile format (+92 or 03xx)"
        required
      />

      <Input
        label="Email Address"
        required={preferredContact === 'EMAIL'}
        autoComplete="email"
        type="email"
        placeholder="e.g. tariq@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={validationErrors.email}
        hint={preferredContact === 'EMAIL' ? 'Required for email replies' : 'Optional — for an email reply'}
      />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Preferred Contact Method
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setPreferredContact('PHONE')}
            className={`py-2.5 px-3 min-h-[44px] rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              preferredContact === 'PHONE'
                ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-400'
                : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
            aria-pressed={preferredContact === 'PHONE'}
          >
            <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            Phone
          </button>

          <button
            type="button"
            onClick={() => setPreferredContact('WHATSAPP')}
            className={`py-2.5 px-3 min-h-[44px] rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              preferredContact === 'WHATSAPP'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-400'
                : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
            aria-pressed={preferredContact === 'WHATSAPP'}
          >
            <svg className="h-3.5 w-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.18-.544-1.613-.666-2.663-2.316-2.744-2.424-.08-.109-.654-.87-.654-1.66 0-.79.414-1.178.56-1.339.146-.16.32-.2.426-.2.106 0 .213.001.306.006.1.005.234-.038.366.279.136.327.466 1.137.507 1.22.041.083.068.181.013.29-.054.108-.082.176-.163.272-.082.096-.172.215-.246.288-.081.08-.166.167-.071.33.095.163.424.7 1.084 1.288.85.758 1.568.992 1.791 1.102.223.109.354.093.486-.06.133-.153.568-.66.721-.887.153-.227.306-.19.513-.113.207.076 1.312.618 1.538.73.226.113.376.168.431.263.055.095.055.553-.089.958z" />
            </svg>
            WhatsApp
          </button>

          <button
            type="button"
            onClick={() => setPreferredContact('EMAIL')}
            className={`py-2.5 px-3 min-h-[44px] rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              preferredContact === 'EMAIL'
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-400'
                : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
            aria-pressed={preferredContact === 'EMAIL'}
          >
            <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            Email
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="inquiry-message" className="block text-sm font-medium text-slate-700 mb-1.5">
          Message <span className="text-slate-400 font-normal text-xs">(Optional)</span>
        </label>
        <textarea
          id="inquiry-message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="I would like to schedule a viewing or request additional floor plans..."
          className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-base sm:text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500 resize-none transition-colors"
          maxLength={1000}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        isLoading={submitting}
        size="lg"
        className="w-full font-bold shadow-sm"
      >
        {submitting ? 'Submitting Inquiry...' : 'Submit Inquiry'}
      </Button>
    </form>
  );
};
