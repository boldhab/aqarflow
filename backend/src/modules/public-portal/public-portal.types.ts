export interface PublicPropertySummary {
  id: string;
  title: string;
  description: string | null;
  price: string | number;
  currency: string;
  type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqFt: number | null;
  city: string | null;
  country: string | null;
  images: Array<{
    id: string;
    url: string;
    caption: string | null;
    isPrimary: boolean;
  }>;
  agency: {
    id: string;
    name: string;
    slug: string;
    phone: string | null;
  };
}
