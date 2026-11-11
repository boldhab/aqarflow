export interface PublicPropertyImage {
  id: string;
  url: string;
  caption?: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface PublicPropertyAgent {
  name: string;
  phone: string | null;
}

export interface PublicAgencyInfo {
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
}

export interface PublicListingItem {
  id: string;
  referenceCode: string;
  title: string;
  description: string | null;
  purpose: 'SALE' | 'RENT' | 'LEASE';
  type: string;
  status: string;
  price: number | string;
  currency: string;
  areaValue: number | string;
  areaUnit: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  city: string | null;
  locality: string | null;
  address?: string | null;
  primaryImage: PublicPropertyImage | null;
  images: PublicPropertyImage[];
  createdAt: string;
}

export interface PublicListingDetail extends PublicListingItem {
  latitude: number | null;
  longitude: number | null;
  assignedAgent: PublicPropertyAgent | null;
  agency: PublicAgencyInfo;
}

export interface PublicPropertyFilters {
  purpose?: string;
  type?: string;
  city?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  bedrooms?: number | string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface PublicFiltersData {
  cities: string[];
  types: string[];
}

export interface InquiryFormData {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  propertyId?: string;
  preferredContact?: 'PHONE' | 'EMAIL' | 'WHATSAPP';
  hp_name?: string; // honeypot
}

export interface PaginatedPublicListings {
  items: PublicListingItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
