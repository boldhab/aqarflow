'use client';

import { useState, useEffect, useCallback } from 'react';
import { propertiesApi } from './api';
import { PropertyItem, PropertyFilters } from './types';
import { useAuth } from '@/shared/hooks';

export function useProperties(initialFilters?: PropertyFilters) {
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(initialFilters?.page || 1);
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters || {});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await propertiesApi.list({ ...filters, page }, token || undefined);
      if (res && res.data) {
        setProperties(res.data.items);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch properties';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filters, page, token]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const updateFilters = (newFilters: Partial<PropertyFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  return {
    properties,
    total,
    totalPages,
    page,
    setPage,
    filters,
    updateFilters,
    clearFilters,
    loading,
    error,
    refetch: fetchProperties,
  };
}
