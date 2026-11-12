'use client';

import { useState, useEffect, useCallback } from 'react';
import { dealsApi } from './api';
import { DealItem } from './types';
import { useAuth } from '@/shared/hooks';

export function useDeals() {
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const refetch = useCallback(() => setRevision(n=>n+1), []);
  const { token } = useAuth();

  useEffect(() => {
    async function fetchDeals() {
      try {
        setLoading(true);
        setError(null);
        const res = await dealsApi.list(token || undefined);
        setDeals(res.data.items);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch deals');
      } finally {
        setLoading(false);
      }
    }
    fetchDeals();
  }, [token, revision]);

  return { deals, loading, error, refetch };
}
