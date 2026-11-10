'use client';

import { useState, useEffect } from 'react';
import { leadsApi } from './api';
import { LeadItem } from './types';
import { useAuth } from '@/shared/hooks';

export function useLeads() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    async function fetchLeads() {
      try {
        setLoading(true);
        const res = await leadsApi.list(token || undefined);
        setLeads(res.data.items);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch leads');
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, [token]);

  return { leads, loading, error };
}
