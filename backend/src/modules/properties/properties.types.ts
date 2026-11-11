import {
  PropertyStatus,
  PropertyPurpose,
  PropertyType,
  AreaUnit,
  UserRole,
} from '@prisma/client';

export { PropertyStatus, PropertyPurpose, PropertyType, AreaUnit, UserRole };

export interface PropertyImageDTO {
  id: string;
  propertyId: string;
  agencyId: string;
  url: string;
  storageKey?: string | null;
  caption?: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: Date;
}

export interface PropertyStatusHistoryDTO {
  id: string;
  propertyId: string;
  agencyId: string;
  fromStatus: PropertyStatus;
  toStatus: PropertyStatus;
  changedById?: string | null;
  createdAt: Date;
  changedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface PropertyDTO {
  id: string;
  agencyId: string;
  referenceCode: string;
  title: string;
  description: string | null;
  purpose: PropertyPurpose;
  type: PropertyType;
  status: PropertyStatus;
  isPublished: boolean;
  price: string | number;
  currency: string;
  areaValue: string | number;
  areaUnit: AreaUnit;
  bedrooms: number | null;
  bathrooms: number | null;
  address: string | null;
  city: string | null;
  locality: string | null;
  latitude: number | null;
  longitude: number | null;
  assignedAgentId: string | null;
  createdById: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  images: PropertyImageDTO[];
  statusHistory?: PropertyStatusHistoryDTO[];
  assignedAgent?: { id: string; name: string; email: string } | null;
  createdBy?: { id: string; name: string; email: string } | null;
}

export interface PaginatedPropertiesResult {
  items: PropertyDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
