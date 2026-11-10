'use client';

import React, { useState } from 'react';
import { Button, Input } from '@/shared/components/ui';
import { useInquiry } from '../hooks';

export interface InquiryFormProps {
  agencyId: string;
  propertyId?: string;
}

export const InquiryForm: React.FC<InquiryFormProps> = ({ agencyId, propertyId }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const { sendInquiry, submitting, success, error } = useInquiry();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendInquiry({ agencyId, propertyId, name, email, phone, message });
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch {
      // handled
    }
  };

  if (success) {
    return (
      <div className="p-4 bg-green-50 text-green-800 rounded-lg text-center font-medium">
        Thank you! Your inquiry has been sent to the agent.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-5 border border-slate-200 rounded-xl bg-white">
      <h4 className="font-semibold text-slate-900">Inquire About This Property</h4>
      {error && <div className="p-2 text-xs text-red-600 bg-red-50 rounded">{error}</div>}
      <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input label="Phone" required value={phone} onChange={(e) => setPhone(e.target.value)} />
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="I would like to schedule a viewing..."
        />
      </div>
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Sending...' : 'Send Inquiry'}
      </Button>
    </form>
  );
};
