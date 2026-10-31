import { ProductCategory, TaxCategory } from './catalog-enums';

export interface Product {
  id?: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  taxCategory: TaxCategory;
  sellable: boolean;
  active?: boolean;
  category: ProductCategory;
  providers?: unknown[];
  stockAtLocation?: number | null;
}

export interface ProductFilters {
  category?: ProductCategory | null;
  active?: boolean | null;
  sellable?: boolean | null;
  taxCategory?: TaxCategory | null;
  headquarterId?: string | null;
}
