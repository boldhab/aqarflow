'use client';

import { useState, useEffect } from 'react';
import { propertiesApi } from './api';
import { PropertyItem } from './types';
import { useAuth } from '@/shared/hooks';

export function useProperties() {
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        const res = await propertiesApi.list(token || undefined);
        setProperties(res.data.items);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch properties');
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, [token]);

  return { properties, loading, error };
}
