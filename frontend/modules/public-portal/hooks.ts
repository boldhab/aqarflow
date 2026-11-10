'use client';

import { useState, useEffect } from 'react';
import { publicPortalApi } from './api';
import { PublicListingItem, InquiryFormData } from './types';

export function usePublicListings() {
  const [listings, setListings] = useState<PublicListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListings() {
      try {
        setLoading(true);
        const res = await publicPortalApi.getListings();
        setListings(res.data.items);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch listings');
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, []);

  return { listings, loading, error };
}

export function useInquiry() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendInquiry = async (formData: InquiryFormData) => {
    setSubmitting(true);
    setError(null);
    try {
      await publicPortalApi.submitInquiry(formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit inquiry');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return { sendInquiry, submitting, success, error };
}
