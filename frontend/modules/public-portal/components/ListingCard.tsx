import { FavoriteButton } from '@/modules/operations/CustomerPortal';
import Link from "next/link";
import { BedDouble, Bath, Ruler, MapPin, ArrowUpRight } from "lucide-react";
import { PublicListingItem } from "../types";
import { formatPKR, humanize } from "@/shared/lib";
import { PropertyImage } from "@/shared/components/ui/PropertyImage";

export function ListingCard({
  property: p,
  list = false,
}: {
  property: PublicListingItem;
  list?: boolean;
}) {
  return (
    <div className="relative"><Link
      href={`/properties/${p.id}`}
      data-testid="property-card"
      className={`group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover hover:border-brand-300 transition-all flex ${list ? "flex-col sm:flex-row" : "flex-col"}`}
    >
      <div
        className={`relative overflow-hidden bg-slate-100 ${list ? "sm:w-72 shrink-0" : ""}`}
      >
        <PropertyImage
          src={(p.primaryImage || p.images[0])?.url}
          alt={p.title}
          className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute top-3 left-3 rounded-full bg-brand-700 px-3 py-1 text-xs font-semibold text-white">
          For{" "}
          {p.purpose === "SALE"
            ? "Sale"
            : p.purpose === "RENT"
              ? "Rent"
              : "Lease"}
        </span>
        <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-slate-700">
          {humanize(p.type)}
        </span>
      </div>
      <div className="p-5 flex flex-1 flex-col gap-3 min-w-0">
        <div>
          <p className="text-2xl font-bold tracking-tight text-brand-700">
            {formatPKR(p.price)}
          </p>
          {p.purpose !== "SALE" && (
            <p className="text-xs text-slate-600 mt-1">
              {p.purpose === "RENT" ? "Rent" : "Lease"} · confirm payment period
              with agent
            </p>
          )}
        </div>
        <h3 className="text-base font-semibold leading-snug line-clamp-2 min-h-[2.75rem] text-slate-900 group-hover:text-brand-700">
          {p.title}
        </h3>
        <p className="text-sm text-slate-600 flex items-center gap-1.5">
          <MapPin size={15} aria-hidden="true" />
          <span className="truncate">
            {[p.locality, p.city].filter(Boolean).join(", ") ||
              "Location available on request"}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-sm text-slate-700">
          {p.bedrooms != null && p.bedrooms > 0 && (
            <span className="inline-flex items-center gap-1">
              <BedDouble size={16} aria-hidden="true" />
              {p.bedrooms} beds
            </span>
          )}
          {p.bathrooms != null && p.bathrooms > 0 && (
            <span className="inline-flex items-center gap-1">
              <Bath size={16} aria-hidden="true" />
              {p.bathrooms} baths
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Ruler size={16} aria-hidden="true" />
            {Number(p.areaValue).toLocaleString()} {p.areaUnit}
          </span>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-xs pt-2">
          <span className="text-brand-700 bg-brand-50 rounded-full px-2.5 py-1">
            {humanize(p.status)}
          </span>
          <span className="text-slate-500">{p.referenceCode}</span>
          <span className="font-semibold text-brand-700 inline-flex items-center gap-1">
            View details
            <ArrowUpRight size={14} aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link><div className="absolute right-3 top-3 z-10"><FavoriteButton propertyId={p.id}/></div></div>
  );
}
