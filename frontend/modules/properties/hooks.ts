"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { propertiesApi } from "./api";
import { PropertyItem, PropertyFilters } from "./types";

export function useProperties() {
  const router = useRouter(),
    searchParams = useSearchParams();
  const query = searchParams.toString();
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [total, setTotal] = useState(0),
    [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null),
    [revision, setRevision] = useState(0);
  const params = new URLSearchParams(query);
  const page = Math.max(1, Number(params.get("page")) || 1);
  const filters: PropertyFilters = {
    limit: 20,
    page,
    status: params.get("status") || undefined,
    purpose: params.get("purpose") || undefined,
    type: params.get("type") || undefined,
    city: params.get("city") || undefined,
    search: params.get("search") || undefined,
  };
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(query);
    const next: PropertyFilters = {
      limit: 20,
      page: Math.max(1, Number(params.get("page")) || 1),
    };
    for (const key of ["status", "purpose", "type", "city", "search"] as const)
      next[key] = params.get(key) || undefined;
    setLoading(true);
    setError(null);
    propertiesApi
      .list(next)
      .then((res) => {
        if (active) {
          setProperties(res.data.items);
          setTotal(res.data.total);
          setTotalPages(res.data.totalPages);
        }
      })
      .catch(() => {
        if (active)
          setError(
            "We couldn’t load inventory. Your filters are saved; please try again.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query, revision]);
  const updateFilters = (values: Partial<PropertyFilters>) => {
    const next = new URLSearchParams(query);
    next.delete("create");
    Object.entries(values).forEach(([key, value]) => {
      if (value) next.set(key, String(value));
      else next.delete(key);
    });
    if (!("page" in values)) next.delete("page");
    router.replace(`/inventory${next.size ? `?${next}` : ""}`, {
      scroll: false,
    });
  };
  return {
    properties,
    total,
    totalPages,
    page,
    filters,
    loading,
    error,
    updateFilters,
    clearFilters: () => router.replace("/inventory"),
    setPage: (page: number) => updateFilters({ page }),
    refetch: useCallback(() => setRevision((n) => n + 1), []),
  };
}
