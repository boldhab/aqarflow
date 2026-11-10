export interface PropertyItem {
  id: string;
  title: string;
  price: number | string;
  currency: string;
  status: string;
  type: string;
  city?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqFt?: number;
}
