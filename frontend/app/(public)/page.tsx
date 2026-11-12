import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ListingCard } from "@/modules/public-portal/components/ListingCard";
import { Building2, House, BriefcaseBusiness, LandPlot } from "lucide-react";
import { HeroSearchForm } from "@/modules/public-portal";
import { PublicListingItem } from "@/modules/public-portal/types";

const API_SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000";

async function getFeaturedProperties(): Promise<PublicListingItem[] | null> {
  try {
    const res = await fetch(
      `${API_SERVER_URL}/api/v1/public/properties?limit=6&sort=newest`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.items || [];
  } catch {
    return null;
  }
}

const categories = [
  {
    title: "Apartments",
    type: "APARTMENT",
    icon: Building2,
    desc: "High-rise flats & luxury suites",
  },
  {
    title: "Houses & Villas",
    type: "HOUSE",
    icon: House,
    desc: "Spacious independent residences",
  },
  {
    title: "Commercial",
    type: "OFFICE",
    icon: BriefcaseBusiness,
    desc: "Corporate HQ & retail spaces",
  },
  {
    title: "Plots & Land",
    type: "PLOT",
    icon: LandPlot,
    desc: "Prime residential & commercial sectors",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative isolate bg-brand-950 text-white overflow-hidden">
        <Image
          src="/images/aqarflow-hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[55%_center] sm:object-center"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-950/80 via-brand-900/75 to-brand-950/90 pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-200 border border-brand-400/30">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"
                aria-hidden="true"
              />
              A clearer way to find your next property
            </span>
          </div>
          <div className="text-center max-w-4xl mx-auto mb-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-4">
              Find Your Dream{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-brand-200">
                Property
              </span>{" "}
              in Pakistan
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Browse property listings across Lahore, Karachi, and Islamabad
              with transparent pricing and direct agent support.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <HeroSearchForm />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {/* Categories */}
        <section aria-labelledby="categories-heading">
          <div className="text-center mb-10">
            <h2
              id="categories-heading"
              className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight"
            >
              Explore by Property Type
            </h2>
            <p className="mt-2 text-slate-500 text-sm max-w-md mx-auto">
              Select a category to find properties tailored to your lifestyle
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.type}
                href={`/properties?type=${cat.type}`}
                className="group bg-white rounded-2xl border border-slate-200 p-6 hover:border-brand-400 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
              >
                <cat.icon
                  className="w-9 h-9 mb-4 text-brand-600"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors text-sm sm:text-base">
                  {cat.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {cat.desc}
                </p>
                <div className="mt-4 flex items-center text-xs font-semibold text-brand-600 group-hover:translate-x-1 transition-transform">
                  Browse &rarr;
                </div>
              </Link>
            ))}
          </div>
        </section>

        <Suspense
          fallback={
            <div role="status" className="grid sm:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-80 rounded-2xl bg-slate-100 animate-pulse"
                />
              ))}
              <span className="sr-only">Loading latest properties…</span>
            </div>
          }
        >
          <LatestProperties />
        </Suspense>

        {/* CTA Banner */}
        <section className="bg-gradient-to-r from-brand-700 to-brand-900 rounded-3xl overflow-hidden">
          <div className="relative px-8 sm:px-12 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden="true"
            >
              <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
            </div>
            <div className="relative text-center md:text-left space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Ready to Buy, Rent, or Sell?
              </h2>
              <p className="text-brand-100 text-sm sm:text-base max-w-md">
                Our property advisors guide you through every step of your real
                estate journey.
              </p>
            </div>
            <div className="relative flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <Link
                href="/contact"
                className="px-6 py-3 rounded-xl font-bold bg-white text-brand-700 hover:bg-brand-50 text-center shadow-lg transition-colors text-sm"
              >
                Get in Touch
              </Link>
              <Link
                href="/properties"
                className="px-6 py-3 rounded-xl font-bold border-2 border-white/40 text-white hover:bg-white/10 text-center transition-colors text-sm"
              >
                Browse Listings
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

async function LatestProperties() {
  const featuredProperties = await getFeaturedProperties();
  return (
    <section aria-labelledby="featured-heading">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h2
            id="featured-heading"
            className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight"
          >
            Latest Properties
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Explore the latest additions from our property marketplace
          </p>
        </div>
        <Link
          href="/properties"
          className="flex-shrink-0 text-sm font-semibold text-brand-600 hover:text-brand-800 transition-colors"
        >
          View all &rarr;
        </Link>
      </div>
      {featuredProperties === null ? (
        <div
          role="alert"
          className="p-8 bg-white rounded-2xl border text-center space-y-3"
        >
          <p className="font-semibold">
            Properties are temporarily unavailable
          </p>
          <p className="text-sm text-slate-600">
            Please try again shortly or contact our team.
          </p>
          <Link
            href="/properties"
            className="inline-block text-brand-700 underline"
          >
            Try browsing properties
          </Link>
        </div>
      ) : featuredProperties.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <House
            size={36}
            className="mx-auto mb-3 text-brand-600"
            aria-hidden="true"
          />
          <p className="text-slate-500 text-sm">
            No properties are published yet.
          </p>
          <Link
            href="/properties"
            className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-800"
          >
            Browse all listings &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProperties.map((prop) => (
            <ListingCard key={prop.id} property={prop} />
          ))}
        </div>
      )}
    </section>
  );
}
