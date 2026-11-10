import { PropertyStatus } from '@prisma/client';

export interface PropertyDTO {
  id: string;
  agencyId: string;
  title: string;
  description: string | null;
  price: string | number;
  currency: string;
  type: string;
  status: PropertyStatus;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqFt: number | null;
  address: string | null;
  city: string | null;
  country: string | null;
  createdAt: Date;
  updatedAt: Date;
}
