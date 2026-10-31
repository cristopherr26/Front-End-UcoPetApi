import { ServiceCategory, TaxCategory } from './catalog-enums';

export interface Service {
  id?: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  taxCategory: TaxCategory;
  sellable: boolean;
  active?: boolean;
  category: ServiceCategory;
  purchasable: boolean;
  providers?: unknown[];
  headquarterIds: string[];
}

export interface ServiceFilters {
  category?: ServiceCategory | null;
  active?: boolean | null;
  purchasable?: boolean | null;
  sellable?: boolean | null;
  taxCategory?: TaxCategory | null;
  headquarterId?: string | null;
}
