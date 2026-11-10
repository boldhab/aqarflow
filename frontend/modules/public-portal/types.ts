export interface PublicListingItem {
  id: string;
  title: string;
  description: string | null;
  price: string | number;
  currency: string;
  type: string;
  city: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaSqFt?: number | null;
  images: Array<{
    id: string;
    url: string;
    isPrimary: boolean;
  }>;
  agency: {
    id: string;
    name: string;
    slug: string;
    phone: string | null;
  };
}

export interface InquiryFormData {
  agencyId: string;
  propertyId?: string;
  name: string;
  email?: string;
  phone: string;
  message?: string;
}
