import { Suspense } from "react";
import { PublicListings } from "@/modules/public-portal";
export default function PropertiesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<p role="status">Loading properties…</p>}>
        <PublicListings />
      </Suspense>
    </div>
  );
}
