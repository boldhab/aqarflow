'use client';

import { useState, useEffect } from 'react';
import { dealsApi } from './api';
import { DealItem } from './types';
import { useAuth } from '@/shared/hooks';

export function useDeals() {
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    async function fetchDeals() {
      try {
        setLoading(true);
        const res = await dealsApi.list(token || undefined);
        setDeals(res.data.items);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch deals');
      } finally {
        setLoading(false);
      }
    }
    fetchDeals();
  }, [token]);

  return { deals, loading, error };
}
