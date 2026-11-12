import { Suspense } from "react";
import { PropertyList } from "@/modules/properties";
export default function InventoryPage() {
  return (
    <Suspense fallback={<p role="status">Loading inventory…</p>}>
      <PropertyList />
    </Suspense>
  );
}
