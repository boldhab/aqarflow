'use client';

import { useState, useEffect } from 'react';
import { visitsApi } from './api';
import { VisitItem } from './types';
import { useAuth } from '@/shared/hooks';

export function useVisits() {
  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    async function fetchVisits() {
      try {
        setLoading(true);
        const res = await visitsApi.list(token || undefined);
        setVisits(res.data.items);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch visits');
      } finally {
        setLoading(false);
      }
    }
    fetchVisits();
  }, [token]);

  return { visits, loading, error };
}
