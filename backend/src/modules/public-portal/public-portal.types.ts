export interface PublicPropertyImage {
  id: string;
  url: string;
  caption: string | null;
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

export interface PublicPropertySummaryDTO {
  id: string;
  referenceCode: string;
  title: string;
  description: string | null;
  purpose: string;
  type: string;
  status: string;
  price: string | number;
  currency: string;
  areaValue: string | number;
  areaUnit: string;
  bedrooms: number | null;
  bathrooms: number | null;
  city: string | null;
  locality: string | null;
  address: string | null;
  primaryImage: PublicPropertyImage | null;
  images: PublicPropertyImage[];
  createdAt: string | Date;
}

export interface PublicPropertyDetailDTO extends PublicPropertySummaryDTO {
  latitude: number | null;
  longitude: number | null;
  assignedAgent: PublicPropertyAgent | null;
  agency: PublicAgencyInfo;
}

export interface PublicFiltersDTO {
  cities: string[];
  types: string[];
}
