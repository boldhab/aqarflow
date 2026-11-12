'use client';

import { useState, useEffect, useCallback } from 'react';
import { visitsApi } from './api';
import { VisitItem } from './types';
import { useAuth } from '@/shared/hooks';

export function useVisits() {
  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const refetch = useCallback(() => setRevision(n=>n+1), []);
  const { token } = useAuth();

  useEffect(() => {
    async function fetchVisits() {
      try {
        setLoading(true);
        setError(null);
        const res = await visitsApi.list(token || undefined);
        setVisits(res.data.items);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch visits');
      } finally {
        setLoading(false);
      }
    }
    fetchVisits();
  }, [token, revision]);

  return { visits, loading, error, refetch };
}
