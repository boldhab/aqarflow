"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Grid2X2, List, Search } from "lucide-react";
import { publicPortalApi } from "../api";
import {
  PublicListingItem,
  PublicPropertyFilters,
  PublicFiltersData,
} from "../types";
import {
  Button,
  Input,
  Select,
  Pagination,
  EmptyState,
  SkeletonCard,
  Alert,
} from "@/shared/components/ui";
import { ListingCard } from "./ListingCard";

function readFilters(query: string): PublicPropertyFilters {
  const params = new URLSearchParams(query);
  return {
    purpose: params.get("purpose") || "",
    type: params.get("type") || "",
    city: params.get("city") || "",
    minPrice: params.get("minPrice") || "",
    maxPrice: params.get("maxPrice") || "",
    bedrooms: params.get("bedrooms") || "",
    search: params.get("search") || "",
    sort: params.get("sort") || "newest",
    page: Math.max(1, Number(params.get("page")) || 1),
    limit: 12,
  };
}
export const PublicListings: React.FC = () => {
  const router = useRouter(),
    searchParams = useSearchParams();
  const query = searchParams.toString();
  const [filters, setFilters] = useState(() => readFilters(query));
  const [draft, setDraft] = useState(filters);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [expanded, setExpanded] = useState(false);
  const [options, setOptions] = useState<PublicFiltersData>({
    cities: [],
    types: [],
  });
  const [optionsError, setOptionsError] = useState(false);
  const [listings, setListings] = useState<PublicListingItem[]>([]);
  const [total, setTotal] = useState(0),
    [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null),
    [retry, setRetry] = useState(0);
  const [validation, setValidation] = useState("");
  useEffect(() => {
    const next = readFilters(query);
    setFilters(next);
    setDraft(next);
  }, [query]);
  useEffect(() => {
    let active = true;
    publicPortalApi
      .getFilters()
      .then((res) => {
        if (active) {
          setOptions(res.data);
          setOptionsError(false);
        }
      })
      .catch(() => {
        if (active) setOptionsError(true);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    publicPortalApi
      .getProperties(filters, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) {
          setListings(res.data.items);
          setTotal(res.data.total);
          setPages(res.data.totalPages);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("We couldn’t load properties. Please try again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filters, retry]);
  function apply(next: PublicPropertyFilters) {
    if (
      next.minPrice &&
      next.maxPrice &&
      Number(next.minPrice) > Number(next.maxPrice)
    ) {
      setValidation("Maximum price must be at least the minimum price.");
      return;
    }
    setValidation("");
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (key !== "limit" && value && !(key === "page" && value === 1))
        params.set(key, String(value));
    });
    setFilters(next);
    setDraft(next);
    setExpanded(false);
    router.replace(`/properties${params.size ? `?${params}` : ""}`, {
      scroll: false,
    });
  }
  const reset = () => apply(readFilters(""));
  const activeCount = [
    "city",
    "type",
    "minPrice",
    "maxPrice",
    "bedrooms",
  ].filter((k) => filters[k as keyof PublicPropertyFilters]).length;
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-700 mb-2">
            Find your next address
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Explore Properties
          </h1>
          <p className="text-slate-600 text-sm mt-2">
            Homes, commercial spaces, and land across Pakistan.
          </p>
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ ...draft, page: 1 });
        }}
        className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-card space-y-4"
      >
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Listing purpose"
        >
          {[
            ["All", ""],
            ["Buy", "SALE"],
            ["Rent", "RENT"],
            ["Lease", "LEASE"],
          ].map(([label, value]) => (
            <button
              key={label}
              type="button"
              aria-pressed={filters.purpose === value}
              onClick={() => apply({ ...draft, purpose: value, page: 1 })}
              className={`px-4 py-2 rounded-xl text-sm font-semibold ${filters.purpose === value ? "bg-brand-600 text-white" : "bg-slate-50 text-slate-700 hover:bg-brand-50"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3 items-end">
          <Input
            label="Search properties"
            placeholder="Title, locality, or sector"
            value={draft.search || ""}
            onChange={(e) => setDraft({ ...draft, search: e.target.value })}
            leftAddon={<Search size={17} aria-hidden="true" />}
          />
          <Button
            type="button"
            variant="outline"
            aria-expanded={expanded}
            aria-controls="advanced-property-filters"
            onClick={() => setExpanded(!expanded)}
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            Filters{activeCount ? ` (${activeCount})` : ""}
          </Button>
          <Button type="submit">Search</Button>
        </div>
        <div
          id="advanced-property-filters"
          className={`${expanded ? "grid" : "hidden"} sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-slate-100`}
        >
          <Select
            label="City"
            aria-label="Filter by city"
            value={draft.city || ""}
            onChange={(e) => setDraft({ ...draft, city: e.target.value })}
            options={[
              { value: "", label: "All Cities" },
              ...Array.from(
                new Set([
                  ...options.cities,
                  ...(draft.city ? [draft.city] : []),
                ]),
              ).map((value) => ({ value, label: value })),
            ]}
          />
          <Select
            label="Property type"
            aria-label="Filter by property type"
            value={draft.type || ""}
            onChange={(e) => setDraft({ ...draft, type: e.target.value })}
            options={[
              { value: "", label: "All Types" },
              ...Array.from(
                new Set([
                  ...options.types,
                  ...(draft.type ? [draft.type] : []),
                ]),
              ).map((value) => ({
                value,
                label: value.toLowerCase().replace(/_/g, " "),
              })),
            ]}
          />
          <Input
            label="Minimum price (PKR)"
            type="number"
            min="0"
            value={draft.minPrice || ""}
            onChange={(e) => setDraft({ ...draft, minPrice: e.target.value })}
          />
          <Input
            label="Maximum price (PKR)"
            type="number"
            min="0"
            value={draft.maxPrice || ""}
            onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value })}
          />
          <Select
            label="Bedrooms"
            aria-label="Filter by bedrooms"
            value={draft.bedrooms || ""}
            onChange={(e) => setDraft({ ...draft, bedrooms: e.target.value })}
            options={[
              { value: "", label: "Any bedrooms" },
              ...[1, 2, 3, 4, 5].map((n) => ({
                value: String(n),
                label: `${n}+ bedrooms`,
              })),
            ]}
          />
          <div className="sm:col-span-2 lg:col-span-5 flex gap-3">
            <Button type="submit" size="sm">
              Apply Filters
            </Button>
            <Button variant="ghost" size="sm" type="button" onClick={reset}>
              Clear Filters
            </Button>
          </div>
        </div>
        {validation && (
          <p role="alert" className="text-sm text-rose-700">
            {validation}
          </p>
        )}
        {optionsError && (
          <p className="text-sm text-slate-600">
            Location options are temporarily unavailable. You can still search
            by title or locality.{" "}
            <button
              type="button"
              className="underline text-brand-700"
              onClick={() => setRetry((n) => n + 1)}
            >
              Retry
            </button>
          </p>
        )}
        {activeCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {(["city", "type", "bedrooms", "minPrice", "maxPrice"] as const)
              .filter((k) => filters[k])
              .map((k) => (
                <button
                  key={k}
                  type="button"
                  className="rounded-full bg-brand-50 px-3 py-1.5 text-xs text-brand-700"
                  aria-label={`Remove ${k} filter`}
                  onClick={() => apply({ ...filters, [k]: "", page: 1 })}
                >
                  {k.replace(/([A-Z])/g, " $1")}: {filters[k]} ×
                </button>
              ))}
          </div>
        )}
      </form>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" aria-live="polite" className="text-sm text-slate-600">
          {loading
            ? "Loading properties…"
            : error
              ? "Properties unavailable"
              : `${total} ${total === 1 ? "property" : "properties"} found`}
        </p>
        <div className="flex items-center gap-3">
          <Select
            aria-label="Sort properties"
            value={filters.sort || "newest"}
            onChange={(e) =>
              apply({ ...filters, sort: e.target.value, page: 1 })
            }
            options={[
              { value: "newest", label: "Newest first" },
              { value: "price_asc", label: "Price: low to high" },
              { value: "price_desc", label: "Price: high to low" },
            ]}
          />
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
              className="p-2 rounded-lg border"
            >
              <Grid2X2 size={18} />
            </button>
            <button
              type="button"
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              className="p-2 rounded-lg border"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>
      {error ? (
        <Alert variant="error" title="Properties are temporarily unavailable">
          <p>{error}</p>
          <Button
            className="mt-3"
            variant="outline"
            onClick={() => setRetry((n) => n + 1)}
          >
            Retry
          </Button>
        </Alert>
      ) : loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          title="No matching properties"
          description="Try a different location, property type, or budget."
          action={
            <Button variant="outline" onClick={reset}>
              Clear Filters
            </Button>
          }
        />
      ) : (
        <div
          className={
            view === "grid"
              ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-5"
          }
        >
          {listings.map((property) => (
            <ListingCard
              key={property.id}
              property={property}
              list={view === "list"}
            />
          ))}
        </div>
      )}
      {!error && !loading && (
        <Pagination
          page={filters.page || 1}
          totalPages={pages}
          total={total}
          limit={12}
          onPageChange={(page) => {
            apply({ ...filters, page });
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
    </div>
  );
};
