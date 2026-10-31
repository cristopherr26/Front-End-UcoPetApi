import { CatalogItemType, TaxCategory } from './catalog-enums';

export interface CatalogItem {
  id: string;
  type: CatalogItemType;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  taxCategory: TaxCategory;
  sellable: boolean;
  active: boolean;
  category: string;
  purchasable: boolean | null;
  headquarterIds: string[] | null;
  stockAtLocation: number | null;
}

export interface CatalogFilters {
  type?: CatalogItemType | null;
  active?: boolean | null;
  sellable?: boolean | null;
  taxCategory?: TaxCategory | null;
  headquarterId?: string | null;
}
