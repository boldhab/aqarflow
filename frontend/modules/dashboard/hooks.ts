'use client';

import { useState, useEffect } from 'react';
import { dashboardApi } from './api';
import { DashboardData } from './types';
import { useAuth } from '@/shared/hooks';

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    async function fetchOverview() {
      try {
        setLoading(true);
        const res = await dashboardApi.getOverview(token || undefined);
        setData(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchOverview();
  }, [token]);

  return { data, loading, error };
}
