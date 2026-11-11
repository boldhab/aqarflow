export type PropertyStatus =
  | 'DRAFT'
  | 'AVAILABLE'
  | 'RESERVED'
  | 'UNDER_OFFER'
  | 'SOLD'
  | 'RENTED'
  | 'LEASED'
  | 'INACTIVE';

export type PropertyPurpose = 'SALE' | 'RENT' | 'LEASE';

export type PropertyType =
  | 'APARTMENT'
  | 'HOUSE'
  | 'VILLA'
  | 'PLOT'
  | 'COMMERCIAL'
  | 'OFFICE'
  | 'SHOP';

export type AreaUnit = 'SQFT' | 'SQM' | 'MARLA' | 'KANAL';

export interface PropertyImage {
  id: string;
  propertyId: string;
  agencyId: string;
  url: string;
  storageKey?: string | null;
  caption?: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface PropertyItem {
  id: string;
  agencyId: string;
  referenceCode: string;
  title: string;
  description?: string | null;
  purpose: PropertyPurpose;
  type: PropertyType;
  status: PropertyStatus;
  isPublished: boolean;
  price: number | string;
  currency: string;
  areaValue: number | string;
  areaUnit: AreaUnit;
  bedrooms?: number | null;
  bathrooms?: number | null;
  address?: string | null;
  city?: string | null;
  locality?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  assignedAgentId?: string | null;
  createdById?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  images: PropertyImage[];
  assignedAgent?: { id: string; name: string; email: string } | null;
  createdBy?: { id: string; name: string; email: string } | null;
}

export interface PropertyFilters {
  status?: string;
  purpose?: string;
  type?: string;
  city?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface CreatePropertyPayload {
  referenceCode?: string;
  title: string;
  description?: string;
  purpose: PropertyPurpose;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  currency: string;
  areaValue: number;
  areaUnit: AreaUnit;
  bedrooms?: number | null;
  bathrooms?: number | null;
  address?: string;
  city?: string;
  locality?: string;
  latitude?: number | null;
  longitude?: number | null;
  assignedAgentId?: string | null;
}

export type UpdatePropertyPayload = Partial<CreatePropertyPayload>;

export interface PaginatedPropertiesResponse {
  success: boolean;
  data: {
    items: PropertyItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
