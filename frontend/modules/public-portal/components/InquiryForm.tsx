'use client';

import React, { useState } from 'react';
import { Button, Input } from '@/shared/components/ui';
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
      errs.phone = 'Please enter a valid Pakistani mobile number (e.g. 03001234567 or +923001234567)';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

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
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
        <div className="text-3xl">✅</div>
        <h4 className="text-lg font-bold text-emerald-900">Inquiry Received</h4>
        <p className="text-sm text-emerald-700">
          Thank you! Your inquiry has been sent to the agent. We will contact you shortly.
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSuccess(false)}
          className="mt-2 text-xs"
        >
          Send Another Inquiry
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4"
    >
      <div>
        <h3 className="text-lg font-bold text-slate-900">
          {propertyTitle ? 'Inquire About This Property' : 'Contact Real Estate Agent'}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Leave your details and an assigned agent will get back to you with viewing availability.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
          {error}
        </div>
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

      <div>
        <Input
          label="Your Full Name *"
          placeholder="e.g. Tariq Mansoor"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={validationErrors.name}
          required
        />
      </div>

      <div>
        <Input
          label="Mobile Phone *"
          placeholder="e.g. 0300 1234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={validationErrors.phone}
          required
        />
      </div>

      <div>
        <Input
          label="Email Address (Optional)"
          type="email"
          placeholder="e.g. tariq@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={validationErrors.email}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Preferred Contact Method
        </label>
        <div className="grid grid-cols-3 gap-2 text-xs font-medium">
          {(['PHONE', 'WHATSAPP', 'EMAIL'] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setPreferredContact(method)}
              className={`py-2 px-3 rounded-lg border text-center transition capitalize ${
                preferredContact === method
                  ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {method.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Message (Optional)
        </label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="I would like to schedule a viewing or request more details..."
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={1000}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={submitting}
        className="w-full font-bold shadow-md hover:shadow-lg transition-all"
      >
        {submitting ? 'Submitting Inquiry...' : 'Submit Property Inquiry'}
      </Button>
    </form>
  );
};
